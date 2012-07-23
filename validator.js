/*! @author: sofish
 * simple validator */
(function($){

	/* rules for the validator
	 * the keys are named correspond to the inputs type
	 */
	var reg = {
			email: /^(?:[a-z0-9]+[_\-+.]?)*[a-z0-9]+@(?:([a-z0-9]+-?)*[a-z0-9]+.)+([a-z]{2,})+$/i,
			date: /[0-9]{4}-%280[1-9]|1[012]%29-%280[1-9]|1[0-9]|2[0-9]|3[01]%29/,
			empty: /^\s?$/
		},
		
		_emptyMsg = function(){
			return {
				unvalid: [],
				empty: [],
				pass: []
			}
		},
		
		_setMsg = function(message, item){
			var action = message === 'pass' ? 'removeClass' : 'addClass',
				papa = item.parent() || item;
			papa[action]('error');
		},
		
		// if the value meets the rule?
		_check = function(msg, item){
			var value = $.trim(item.val()),
				type = item.attr('type'),
				patternStr = item.attr('pattern'),

				// `pattern` should take precedence over type
				pattern = (patternStr && new RegExp(patternStr)) || reg[type];

			// make sure the item is empty
			if(value === '') return msg['empty'].push(item), _setMsg('empty', item);
			if(!pattern) {
				var tagName = item[0].nodeName.toLowerCase();
				
				/* - -! select & textares! it suck.
				 * DO NOT specific any more, use the `pattern` or `reg` object
				 */
				if(value !=='') return msg['pass'].push(item), _setMsg('pass', item);
				return msg['unvalid'].push(item), _setMsg('unvalid', item);
			}
			if(!pattern.test(value)) return msg['unvalid'].push(item), _setMsg('unvaild', item);
			
			return msg['pass'].push(item), _setMsg('pass', item);
		}, 

		validator = function(form, items, callback){
			var msg = _emptyMsg();
			items.each(function(i, item){
				_check(msg, $(item));
			})
			
			if(msg.pass.length === items.length) form[0].submit(); 
			callback.call(this, msg);
		};
		
	/* the `callback` function accepts one argument: `message` 
	 * u're by default to have the `message` obj which is an {Object} 
	 *  contains the message types and the correspond items(jQuery Object)
	 *  `unvalid`: not valid
	 *  `empty`: the value is empty
	 *  `pass`: the item is valid
	 */	
	$.fn.validate = function(options){
		
		var that = this,
			items = $('[required]' ,that),
			callback = options['callback'],
			prevalid = options['prevalid'] || 0;
			
		/* dont't forget the `novalidate` attribute
		 * prevent browser from showing the default error message
		 */
		typeof that.attr('novalidate') !== 'string' && that.attr('novalidate', 'true');
		
		that.on('submit', function(e){
			e.preventDefault();
			validator(that, items, callback);
		})
		
		
		/* if `prevaild` is set to true, the validator will running when
		 *  the `[required]` item's `blur` event is fired, 
		 *  and an `error` event will be triggered
		 *  as well as `class="error"` will be set to the item's parentNode
		 *  
		 * ```
		 * $('[required]').on('error', function(e, msg){
		 *	 console.log(msg)
		 * })
		 * ```
		 */
		prevalid && items.on('blur', function(){
			var msg = _emptyMsg(),
				that = $(this);
			_check(msg, that);
			
			for(var p in msg){
				if(msg.hasOwnProperty(p) && msg[p][0] === that) {
					_setMsg(p, that);
					return that.trigger('error', p);
				}
			}
			
		})
	}
	
})(jQuery);