var shortcut_manager = function(){
	var shortcuts={};
	function key_down(ev) {
		
	}

	function key_up(ev) {
		for (var code in shortcuts){
			if (ev.keyCode == code && ev.shiftKey == shortcuts[code].shift){
				shortcuts[code].func.apply(null, shortcuts[code].args);
			}
		}
	}

	function add(code, shift, func, args) {
		if (!shortcuts[code]){
			shortcuts[code] = {func: func, shift: shift, args: args};
		}
	}

	function add_scramble(code, name) {
		add(code, true, scramble_manager.change, [name]);
	}

	function add_default() {
		add(82, true, ui.reset); //R for reset
		//add(27, false, ui.reset); //esc for reset

		add(68, true,	//D for delete last solve
			function(){ 
				session.del(session.length() - 1);
				ui.update_stats();
			});
		
		add(79, true, ui.toggle_options); //O for option toggle

		add(73, true,	//I for inspection toggle
			function(){ 
				timer.toggle_inspection();
				ui.toggle_inspection();
			});
		
		add_scramble(53, '5x5');
		add_scramble(52, '4x4');
		add_scramble(51, '3x3');
	}

	return {
		add_default: add_default,
		key_up: key_up,
		add: add,
		add_scramble: add_scramble

	};
}();