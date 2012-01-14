var shortcut_manager = function(){
	var shortcuts={}
	function key_down(ev) {
		
	}

	function key_up(ev) {
		for (var code in shortcuts){
			if (ev.keyCode == code && ev.shiftKey == shortcuts[code].shift){
				shortcuts[code].func();
			}
		}
	}

	function add_default() {
		shortcuts[82] = { func: ui.reset, shift: true}; //R for reset
		shortcuts[27] = { func: ui.reset, shift: false}; //esc for reset

		shortcuts[68] = { func: function(){ //D for delete last solve
									session.del(session.length() - 1);
									ui.update_stats();
								},
							shift: true};

		shortcuts[73] = { func: function(){ //I for inspection toggle
									timer.toggle_inspection();
									ui.toggle_inspection();
								},
							shift: true};
	}

	return {
	add_default: add_default,
	key_up: key_up
	}
}();