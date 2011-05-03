/**
 * @author: Clément Gautier
 * @since: 26/04/2011
 * @licence: Licence Creative Commons Paternité - Partage des Conditions Initiales à l'Identique 3.0 Unported. http://creativecommons.org/licenses/by-sa/3.0/
 * @description: Plugin that emulate some html5 features :
 * 	-> input attributes : autofocus | placeholder | required | min | max
 *	-> input types : email | range
 *  Note that the UI effects are provided by jQuery UI and couldn't be used if jQuery UI is not detected
 * @todo: When submiting the form and have some validation errors, placeholder values disapears
*/

(function($){

	$.html5 = {
		init: function(options, closure) {
		
			$.html5.support();
			// Input Attributes
			$.each($.html5.emulate.attribute, function(name, func) {
				// if browser not support the feature and options activated then lets rock
				if(!$.support.html5.attribute[name] && options.emulate.attribute[name] === true) {
					func(closure, options);
				}
			});
			// Input Types
			$.each($.html5.emulate.type.regex, function(type, regex) {
				// validation
				if(!$.support.html5.type[type] && options.emulate.type.validation[type] === true) {
					$.html5.emulate.type.validation(type, closure, options);
				}
				// feature emulation
				if(!$.support.html5.type[type] && options.emulate.type.featuring[type] === true) {
					$.html5.emulate.type.featuring(type, closure, options)
				}
			});
			
		},
		support: function() {
			// inspirate by Modernizr (http://www.modernizr.com/) in version 1.7
			
			var input = document.createElement('input');
			var docElement = document.documentElement;
			var smile = ':)';
			
			$.extend(true, $.support, {html5:{
				type: {},
				attribute: {
					autocomplete: 'autocomplete' in input,
					autofocus: 'autofocus' in input,
					list: 'list' in input,
					placeholder: 'placeholder' in input,
					max: 'max' in input,
					min: 'min' in input,
					multiple: 'multiple' in input,
					pattern: 'pattern' in input,
					required: 'required' in input,
					step: 'step' in input
				}
			}});
			
			$.each($.html5.emulate.type.regex, function(index, value) {
				input.setAttribute('type', index);
				bool = input.type != 'text';
				
				// We first check to see if the type we give it sticks.. 
				// If the type does, we feed it a textual value, which shouldn't be valid.
				// If the value doesn't stick, we know there's input sanitization which infers a custom UI
				if (bool){  
				  
					input.value         = smile;
					input.style.cssText = 'position:absolute;visibility:hidden;';
	 
					if (/^range$/.test(index) && typeof input.style.WebkitAppearance !== 'undefined'){
					  
					  docElement.appendChild(input);
					  defaultView = document.defaultView;
					  
					  // Safari 2-4 allows the smiley as a value, despite making a slider
					  bool =  defaultView.getComputedStyle && 
							  defaultView.getComputedStyle(input, null).WebkitAppearance !== 'textfield' &&                  
							  // Mobile android web browser has false positive, so must
							  // check the height to see if the widget is actually there.
							  (input.offsetHeight !== 0);
							  
					  docElement.removeChild(input);
							  
					} else if (/^(search|tel)$/.test(index)){
					  // Spec doesnt define any special parsing or detectable UI 
					  //   behaviors so we pass these through as true
					  
					  // Interestingly, opera fails the earlier test, so it doesn't
					  //  even make it here.
					  
					} else if (/^(url|email)$/.test(index)) {
					  // Real url and email support comes with prebaked validation.
					  bool = input.checkValidity && input.checkValidity() === false;
					  
					} else if (/^color$/.test(index)) {
						// chuck into DOM and force reflow for Opera bug in 11.00
						// github.com/Modernizr/Modernizr/issues#issue/159
						docElement.appendChild(input);
						docElement.offsetWidth; 
						bool = input.value != smile;
						docElement.removeChild(input);

					} else {
					  // If the upgraded input compontent rejects the :) text, we got a winner
					  bool = input.value != smile;
					}
				}
				
				$.support.html5.type[index] = !!bool;
				
			});			
			
		},
		emulate: {
			attribute: {
				placeholder: function(closure, options) {
					$("input[placeholder], textarea[placeholder]", closure).live("focus.html5", function(){
                        var $this = $(this), fake = $this.data('fakeInput');
						if(($this.val() == $this.attr('placeholder') || fake) && !$this.data('filled')){
                            $this.show().val("").data('filled', true);
						}
					}).live("blur.html5", function(){
                        var $this = $(this);
						if($this.val() == ""){
                            $.html5.util.handlePassword($this);
                            var fake = $this.data('fakeInput');
                            if(fake) {
                                fake.show();
                                $this.hide();
                            }
                            else
                                $this.val($this.attr('placeholder'));
							$this.data('filled', false);
						}
					}).trigger("blur.html5").closest("form").bind("submit.html5", function(e) {
						if(!e.isDefaultPrevented()) {
                            $("input[placeholder], textarea[placeholder]",closure).die('blur.html5');
							$("input[placeholder], textarea[placeholder]",this).trigger('focus.html5');
						}
					});
				},
				autofocus: function(closure, options) {
					$("button[autofocus], input[autofocus], keygen[autofocus], select[autofocus], textarea[autofocus]", closure).last().focus();
				},
				required: function(closure, options) {
					$("form", closure).live("submit.html5", function(e) {
						$("input[required], select[required], textarea[required]", this).each(function() {
							if($(this).val() === '') {
								if(!e.isDefaultPrevented()) {
									e.preventDefault();
								}
								$(this).addClass(options.baseClassName + 'required-error')
									.unbind('blur.html5', $.html5.util.removeClassName)
									.bind('blur.html5', {className: options.baseClassName + 'required-error'}, $.html5.util.removeClassName);
							}
						});
					});
				}
			},
			type: {
				regex: {
					search: /^.*$/i, // @todo
					tel: /^.*$/i, // @todo
					url: /^.*$/i, // @todo
					email: /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i,
					datetime: /^.*$/i, // @todo
					date: /^.*$/i, // @todo
					month: /^.*$/i, // @todo
					week: /^.*$/i, // @todo
					time: /^.*$/i, // @todo
					'datetime-local': /^.*$/i,  // @todo
					number: /^\s*\d+\s*$/, // @todo
					range: /^.*$/i, // @todo
					col: /^.*$/i, // @todo
				}, 
				validation: function(type, closure, options) {
					/* type validation : test a defined pattern */
					$("form", closure).live("submit.html5", function(e) {
						$("[type='"+type+"']:input", this).each(function() {
							if($(this).val() !== '' && !$.html5.emulate.type.regex[type].test($(this).val())) {
								if(!e.isDefaultPrevented()) {
									e.preventDefault();
								}
								$(this).addClass(options.baseClassName + 'validate-error')
									.unbind('blur.html5', $.html5.util.removeClassName)
									.bind('blur.html5', {className: options.baseClassName + 'validate-error'}, $.html5.util.removeClassName);
							}
						});
					});
				},
				featuring: function(type, closure, options) {
					switch(type) {
						case 'range': 
							// we need jQuery UI and a specified name.
							if($.html5.util.isUIAvailable()) {
								var opts;
								$("input[type=range][name]", closure).each(function() {
									opts = {min: 0,	max: 100, step: 1, orientation:'horizontal'}; // default W3C specs
									
									if (typeof $(this).attr('min') != 'undefined' && $(this).attr('min') != '') {
										opts.min = parseFloat($(this).attr('min'));
									}
									if (typeof $(this).attr('max') != 'undefined' && $(this).attr('max') != '') {
										opts.max = parseFloat($(this).attr('max'));
									}
									if (typeof $(this).attr('step') != 'undefined' && $(this).attr('step') != '') {
										opts.step = parseFloat($(this).attr('step'));
									}
									if (typeof $(this).attr('disabled') != 'undefined' && $(this).attr('disabled') != '') {
										opts.disabled = true;
									}
									
									if ($(this).val() != '' && $(this).val() < opts.max && $(this).val() > opts.min) {
										opts['value'] = parseFloat($(this).val());
									} else {
										opts['value'] = (opts.max + opts.min)/2
									}
									
									// ratio for orientation :
									if($(this).outerHeight() > $(this).outerWidth()) {
										opts.orientation = 'vertical';
									}
									
									$(this)
										.wrap('<div class="' + options.baseClassName + 'ui-slider-wrapper"></div>')
										.after($('<div name="' + $(this).attr('name') + '" class="' + options.baseClassName + 'ui-slider' + '" style="width:' + $(this).outerWidth() + 'px;height:' + $(this).outerHeight() + 'px;"></div>'))
										.after($('<input type="hidden" name="' + $(this).attr('name') + '" value="' + opts['value'] + '" />'))
										.parents('form:first').bind('submit.html5', function(e) {
											$('div.' + options.baseClassName + 'ui-slider-wrapper', this).each(function() {
												$('input[type=hidden]', this).val($(".ui-slider", this).slider('value'));
											});
										}).end()
										.siblings('div[name="' + $(this).attr('name') + '"].' + options.baseClassName + 'ui-slider:first').slider(opts)
											.find(".ui-slider-handle").css(opts.orientation === 'horizontal' ? {height: $(this).outerHeight()+8+'px'} : {width: $(this).outerWidth()+8+'px'}).end()
										.end()
										.remove();
								});
							} else {
								if(options.debug) {
									$.html5.util.log("jQuery UI not loaded, you can't use featuring emulation for input type " + type);
								}
							}
							break;
						default:
							if(options.debug) {
								$.html5.util.log('No feature available for type ' + type);
							}
							break;
					}
				}
			}
		},
		util: {
			removeClassName: function(event) {
				$(this).removeClass(event.data.className);
			},
			log: function(text) {
				console.log('jquery.html5: ' + text);
			},
			isUIAvailable: function() {
				return typeof jQuery.ui != 'undefined';
			},
            handlePassword: function(obj) {
                if(obj.attr('type') === 'password') {
                    try {
                        obj[0].setAttribute('type', 'text');
                        if(!obj.data('passwordFocused')) {
                            obj.bind('focus.html5', function() {
                                obj[0].setAttribute('type', 'password');
                            }).data('passwordFocused', true);
                        }
                    }
                    catch(e) {
                        if(!obj.data('fakeInput')) {
                            obj.data('fakeInput',
                                $(obj[0].outerHTML.replace(/type=(['"])?password\1/gi, 'type=$1text$1'))
                                    .val(obj.attr('placeholder'))
                                    .bind('focus.html5', function() {
                                        obj.trigger('focus.html5');
                                        $(this).hide();
                                    })
                                    .insertBefore(obj)
                            );
                        }
                    }
                }
                return obj;
            }
		}
	}
	
	$.fn.html5 = function(options) {
	
		var settings = {
			debug: true,
			baseClassName: 'html5base-',
			emulate: { // can be desactivated one by one for frontend performance
				attribute: {
					placeholder: true,
					autofocus: true,
					required: true
				},
				type: {
					validation: {
						email: true
					},
					featuring: {
						range: true
					}
				}
			}
		};
		
		$.extend(true, settings, options || {});
		$.html5.init(settings, this);
		
		return this;
	
	}

})(jQuery);