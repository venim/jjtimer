function load_external(url) {
	$.getScript(url);
} 

var ui = function() {
	var timer_label, scramble_label, stats_label, options_label;
	var update_timer, inspection_timer, inspection_count = 15;

	function human_time(time) {
		if(time < 0) return "DNF";
		var useMilli = false;
		time = Math.round(time / (useMilli ? 1 : 10));
		var bits = time % (useMilli ? 1000 : 100);
		time = (time - bits) / (useMilli ? 1000 : 100);
		var secs = time % 60;
		var mins = ((time - secs) / 60) % 60;
		var hours = (time - secs - 60 * mins) / 3600;
		var s = "" + bits;
		if (bits < 10) {s = "0" + s;}
		if (bits < 100 && useMilli) {s = "0" + s;}
		s = secs + "." + s;
		if (secs < 10 && (mins > 0 || hours > 0)) {s = "0" + s;}
		if (mins > 0 || hours > 0) {s = mins + ":" + s;}
		if (mins < 20 && hours > 0) {s = "0" + s;}
		if (hours > 0) {s = hours + ":" + s;}
		return s;
	}

	function solve_time(solve) {
		var out = "";
		if(solve['DNF'])
			out += "DNF(";

		out += human_time(solve['time'] + (solve['plus_two'] ? 2000 : 0));
		out += solve['plus_two'] ? "+" : "";

		if(solve['DNF'])
			out += ")";
		return out;
	}

	function on_inspection() {
		timer_label.html(inspection_count);
		inspection_count -= 1;
		inspection_timer = setTimeout(on_inspection, 1000);
	}

	function next_scramble()
	{
		scramble_label.html(scramble_manager.next());
	}

	function update_stats() {
		$('#s_t').html(session.length());
		$('#c_a_5').html(human_time(session.current_average(5)));
		$('#c_a_12').html(human_time(session.current_average(12)));
		$('#c_a_100').html(human_time(session.current_average(100)));
		$('#b_a_5').html(human_time(session.best_average(5)['avg']));
		$('#b_a_12').html(human_time(session.best_average(12)['avg']));
		$('#b_a_100').html(human_time(session.best_average(100)['avg']));
		$('#s_a').html(human_time(session.session_average()));
		$('#s_m').html(human_time(session.session_mean()));
		times_label.html(to_times_list());
	}

	function time_link(index) {
		var out = "<span onclick='ui.del("+index+")'>";
		out += solve_time(session.solves()[index]);
		return out + "</span>";
	}

	function to_times_list(hilight_index, length) {
		if(session.length() < 1) return "&nbsp;"
		var out = "";
		for(var i = 0; i < session.length(); ++i)
		{
			if(i != 0) out += ", ";
			if(i === hilight_index) out += "<span class='h'>";
			out += time_link(i);
			if(i === hilight_index + length) out += "</span>";
		}
		return out;
	}
	
	function populate_scramblers_menu() {
		var menu = $('#scramble_menu')[0];
		for(var i = 0; i < scramble_manager.scramblers.length; i++)
		{
			menu.options[i] = new Option(scramble_manager.get_name(i));
		}
	}

	function toggle_options() {
		$('#options').fadeToggle();
		$('#gray_out').fadeToggle(); 
	}
	
	function highlight(start, length) {
		if(timer.is_running()) return;
		times_label.html(to_times_list(start, length - 1));
	}

	function hilight_current(length) {
		highlight(session.length() - length, length);
	}

	function key_down(ev) {
		timer.trigger_down();
	}

	function key_up(ev) {
		if(ev.keyCode === 27)
		{
			if($('#options').is(':visible'))
			{
				toggle_options();
				return;
			}
			else if(!timer.is_running()) {
				ui.reset();
				return;
			}
		}
		if($('#options').is(':visible')) return;
		timer.trigger_up(ev.keyCode === 32);
	}

	function mouse_down() {
		timer.trigger_down();
	}

	function mouse_up() {
		if($('#options').is(':visible')) return;
		timer.trigger_up(true);
	}

	function use_mouse() {
		$(document).off("keydown", key_down);
		$(document).off("keyup", key_up);

		timer_label.mousedown(mouse_down);
		timer_label.mouseup(mouse_up);
	}

	function use_keyboard() {
		timer_label.off("mousedown", mouse_down);
		timer_label.off("mouseup", mouse_up);
		
		$(document).keydown(key_down);	
		$(document).keyup(key_up);
	}

	return {
	on_inspection: on_inspection,

	on_running: function() {
		clearTimeout(inspection_timer);
		inspection_count = 15;
		update_timer = setInterval(ui.update_running, 10);
		$('.hide_on_running').addClass('g');
	},

	update_running: function() {
		timer_label.html(human_time(timer.current_time()));
	},

	on_stop: function() {
		clearInterval(update_timer);
		timer_label.html(human_time(timer.current_time()));
		$('.hide_on_running').removeClass('g');
		next_scramble();
		update_stats();
	},

	
	del: function(index) {
		if(timer.is_running()) return;
		session.del(index);
		times_label.html(to_times_list());
		update_stats();
	},

	reset: function() {
		timer.reset();
		next_scramble();
		update_stats();
		timer_label.html("0.00");	
		times_label.html("&nbsp;");
	},

	load_plugin: function() {
		var url = $('#plugin_url').val();
		load_external(url);
		$('#plugin_url').value = "";
	},

	plugin_loaded: function(name) {
		$('info').html("loaded " + name);
		populate_scramblers_menu();
		setTimeout(function() {
			$('info').html("");
		}, 1000);
	},

	render_body: function() {
		var out = '<div id="left"><div id="info"></div>'+
              '<div id="timer_label">0.00</div>'+
              '<div id="scramble_label" class="hide_on_running"></div>'+
              '<div id="penalty" class="hide_on_running a">that time was: <span id="p2">+2</span> <span id="dnf">DNF</span></div>'+
              '<div class="hide_on_running" id="bottom_bar"><div id="stats_label">'+
              'times: <span id="s_t">0</span><br />'+
              '<span id="stats_link" class="a">'+
              'current average: <span id="c_a_5"></span>, <span id="c_a_12"></span>, <span id="c_a_100"></span><br />'+
              'best average: <span id="b_a_5"></span>, <span id="b_a_12"></span>, <span id="b_a_100"></span><br />'+
              'session average: <span id="s_a"></span>, mean: <span id="s_m"></span></span></div>'+
              '<div id="options_label" class="a"><span>options</span></div></div></div>'+

              '<div id="right"><div id="times_label" class="a hide_on_running"></div></div>'+
              '<div id="options" style="display: none;"><h2 style="margin: 0; padding: 0">options</h2>'+
              '<p><select id="scramble_menu"></select></p>'+
              '<p><input type="input" id="plugin_url" /><input type="submit" onclick="ui.load_plugin()" value="load"/></p>'+
              '<p><input type="checkbox" id="use_inspection"><label for="use_inspection">use inspection</label>'+
              '<h3 style="margin: 0; padding: 0">session</h3>'+
              '<p><input type="submit" id="save_btn" value="save" /> <input type="submit" id="load_btn" value="load" /></p>'+
							'<p><select id="trigger_select"><option value="keyboard">keyboard</option>'+
							'<option value="mouse">mouse</option></select></p>'+
              '<span class="a"><span id="close_options">close</span></span></div>'+
              '<div id="gray_out" style="display: none;"></div>';
		$(document.body).html(out);
	},

	init: function() {
		ui.render_body();

		timer_label = $('#timer_label');
		scramble_label = $('#scramble_label');
		stats_label = $('#stats_label');
		times_label = $('#times_label');
		options_label = $('#options_label');

		$('#p2').click(function() { session.toggle_plus_two(); update_stats(); timer_label.html(solve_time(session.last())); });
		$('#dnf').click(function() { session.toggle_dnf(); update_stats(); timer_label.html(solve_time(session.last())); });

		$('#c_a_5').click(function() { hilight_current(5); });
		$('#b_a_5').click(function() { var index = session.best_average(5)['index']; highlight(index, 5); });
		$('#c_a_12').click(function() { hilight_current(12); });
		$('#b_a_12').click(function() { var index = session.best_average(12)['index']; highlight(index, 12); });
		$('#s_a').click(function() { hilight_current(session.length()); });
		$('#s_m').click(function() { hilight_current(session.length()); });

		$('#options_label').click(toggle_options);
		$('#close_options').click(toggle_options);
		$('#gray_out').click(toggle_options);

		$('#scramble_menu').change(function() {
			scramble_manager.set($('#scramble_menu').prop('selectedIndex'));
			next_scramble();
		});
		$('#use_inspection').change(timer.toggle_inspection);
		$('#load_btn').click(function() { session.save(); });
		$('#load_btn').click(function() { session.load(); update_stats(); });
		$('#trigger_select').change(function() {
			switch($('#trigger_select').prop('selectedIndex')) {
				case 0: use_keyboard(); break;
				case 1: use_mouse(); break;
			}
		});
	
		scramble_manager.add_default();
		populate_scramblers_menu();

		ui.reset();
		
		$(document).keydown(key_down);	
		$(document).keyup(key_up);
	}	
	};
}();
$(document).ready(ui.init);
