/* globals $ noUISlider firebase */

$(document).ready(function() {


    /*
     *
     * FIREBASE INITIALIZATION
     *
     */

	var config = {
		apiKey: "AIzaSyDuppFzLT1rYOsl3d_TDaztfOOKFrjfKfs",
		authDomain: "pomoderp.firebaseapp.com",
		databaseURL: "https://pomoderp.firebaseio.com",
		storageBucket: "pomoderp.appspot.com",
		messagingSenderId: "435710927543"
	};
	firebase.initializeApp(config);

	var db = firebase.database();



	$.material.init();



    /*
     *
     * AUTH
     *
     */

    // Login form
    var $loginForm = $('#login-form');
    var $loginEmail = $('#login-email');
    var $loginPassword = $('#login-password');
    var $loginSubmit = $('#login-submit');



    // Registration form
    var $registerForm = $('#register-form');
    var $registerEmail = $('#register-email');
    var $registerPassword = $('#register-password');
    var $registerSubmit = $('#register-submit');

	//Gravatar image
	var $gravatar = $('#gravatar');
	var userPhoto = null;

    var user = null;
    var currAuth = false;
	var userEmail = null;
	var derpKey = null;




	// Watch Firebase auth object for changes
	function getCurrentAuth() {
		firebase.auth().onAuthStateChanged(function(fbUser) {
			// TODO Define views based on auth state?
			if (fbUser) {
				currAuth = true;
				user = fbUser.uid;
				console.log(user);
				appView();
				getGravatar(fbUser.email);
			}
			else {
				currAuth = false;
				console.log('no auth');
				noAuthView();
			}
		});
	}

	getCurrentAuth();




    // Auth functions

    function registerUser() {
    	var formEmail = $('#register-email').val();
		var password = $('#register-password').val();
        firebase.auth().createUserWithEmailAndPassword(formEmail, password)
			.catch(function (error) {
				var errorCode = error.code;
				var errorMessage = error.message;
				console.log(errorCode + ': ' + errorMessage);
			})
			.then(function(fbUser) {
				var uid = fbUser.uid;
				var email = fbUser.email;
				var updates = {
					email: email,
					completedCount: 0
				};
				user = fbUser;
				db.ref('users/' + uid).update(updates);
				appView();
				getGravatar(email);
			});
    }



    function signIn() {
        var formEmail = $loginEmail.val();
        var password = $loginPassword.val();
        firebase.auth().signInWithEmailAndPassword(formEmail, password)
            .catch(function(error) {
            	var errorCode = error.code;
				var errorMessage = error.message;
				console.log(errorCode + ': ' + errorMessage);
			})
			.then(function(fbUser) {
				user = fbUser;
				appView();
				getGravatar(formEmail);
			});
    }



    function signOut() {
        firebase.auth().signOut()
            .then(function() {
                // TODO redirect to login page after sign out
            }, function(error) {
                console.log(error);
            });
    }




	// Retrieve Gravatar
	function getGravatar(email) {
		var res = email.toLowerCase();
		var hash = MD5(res);
		userPhoto = "https://gravatar.com/avatar/" + hash + ".jpg?s=52";
		console.log('hash:' + hash);
	/*	user.updateProfile({
			photoURL: 'https://gravatar.com/avatar/' + hash + '.jpg'
		});
		userPhoto = user.photoURL; */
		$('#gravatar').attr("src", userPhoto);
	}







    /*
     *
     * VIEW
     *
     */

    var $authDiv = $('#auth-container');

    var $loginDiv = $('#login-div');
    var $showLogin = $('#show-login');

    var $registerDiv = $('#register-div');
    var $showRegister = $('#show-register');

	var $signOutBtn = $('#sign-out');



    // View functions

    function noAuthView() {
        $appDiv.hide();
		$signOutBtn.hide();
        $authDiv.show();
    }



    function registerView() {
        $loginDiv.hide();
        $registerDiv.delay().show();
    }



    function loginView() {
        $registerDiv.hide();
        $loginDiv.delay().show();
    }



    function appView() {
        $authDiv.hide();
        $appDiv.delay().show();
		$signOutBtn.delay().show();
    }



    // View actions

    $showRegister.click(function() {
        registerView();
    });



    $showLogin.click(function() {
        loginView();
    });




    $registerSubmit.click(function() {
        registerUser();
    });




    $loginSubmit.click(function() {
        signIn();
    });



	$signOutBtn.click(function() {
		signOut();
	});




	/*
	 *
	 * TIMER
	 *
	 */

	var derpPathRef = db.ref('derps');
	var derp = {};


	var min = 25;
	var sec = 0;

	var active = false; // flags whether pomodoro timer is running
	var paused = false;
	var complete = false;

	var intv;

	var $appDiv = $('#app-container');
	var $timerCtr = $('#timectr');
	var $successDiv = $('#success-container');

	var $tMin = $('#timer-minutes');
	var $tSec = $('#timer-seconds');
	var $timer = $('.main-timer');

	var $start = $('#startbt');
	var $pause = $('#pausebt');
	var $reset = $('#resetbt');
	var $toggleBtn = $('#toggleBtn');
	var $toggleBreak = $('#break-mode');

	var $breakMessage = $('#break-message');
	var $successHeader = $('#success-message-header');
	var $successSubhead = $('#success-message-subhead');
	var $dismiss = $('#dismiss');


	// Slider to set timer length in minutes
	var $slider = $('#pomo-slider').slider({
		animate: 'slow',
		max: 50,
		min: 1,
		value: 25,
		slide: function (event, ui) {
			min = ui.value;
			$tMin.text(min);
		}
	});



	function createNewDerp(user, sliderMin) {

		// A new derp entry
		var newDerpData = {
			bothCompleted: false,
			breakCompleted: false,
			derpCompleted: false,
			breakActive: false,
			createdAt: firebase.database.ServerValue.TIMESTAMP
		};

		// Get key for new derp
		var newDerpKey = firebase.database().ref('derps').push().key;

		// Write new derp's data to db and add derp's UID to user
		var updates = {};
		updates['/derps/' + newDerpKey] = newDerpData;
		updates['/users/' + user + '/derpList/' + newDerpKey] = true;

		db.ref().update(updates);
		var updateUser =  {};
		updateUser['/user/' + user] = true;
		var derpRef = firebase.database().ref('/derps/' + newDerpKey);
		derpRef.update(updateUser);
		derpKey = newDerpKey;
	};




	function pauseCount() {

		clearInterval(intv);

		$pause.fadeOut('slow', 'swing');
		$start.delay('slow').fadeIn('slow', 'swing');
		$reset.delay('slow').fadeIn('slow', 'swing');
	};




	function resetCount() {

		if (!$toggleBreak.is(':checked')) {
			createNewDerp(user, sliderMin);
			min = 25;
		}
		else if ($toggleBreak.is(':checked')) {
			min = 5;
		}

		sec = 0;

		$tMin.text(min);
		$tSec.text(checkTime(sec));

		$reset.fadeOut('slow', 'swing');
		$start.fadeOut('slow', 'swing');
		$slider.delay('slow').fadeIn('slow', 'swing');
		$start.delay('slow').fadeIn('slow', 'swing');
		$toggleBtn.delay('slow').delay('slow').fadeIn('slow', 'swing');
	};




	function checkTime(i) {
		if (i < 10) {
			i = '0' + i;
		}
		return i;
	};




	function countDown(min, sec) {

		$start.fadeOut('slow', 'swing');
		$pause.delay('slow').fadeIn('slow', 'swing');
		$slider.fadeOut('slow', 'swing');
		$toggleBtn.fadeOut('slow', 'swing');
		$reset.fadeOut('slow', 'swing');

		intv = setInterval(function () {
			if (sec === 0) {
				sec = 59;
				min = min - 1;
			}
			else {
				sec = sec - 1;
			}

			$tMin.text(checkTime(min));
			$tSec.text(checkTime(sec));

			if (min === 0 && sec === 0) {
				clearInterval(intv);
				completed();
			}
		}, 1000);
	};




	function initializeNewTimer() {

		var derpKey = createNewDerp(user, min);
		countDown(min, sec);
	};




	function checkToggle() {

		if ($toggleBreak.prop('checked')) {
			console.log($toggleBreak.prop('checked') + ' else');
			//toggleBreak.prop('checked');
			$timerCtr.hide('slide', 'left', 'slow');

			setTimeout(function () {
				$('#pomo-slider').slider('value', 5);
				// $( '#pomo-slider' ).slider('option', 'max', 25);

				min = 5;
				$tMin.text(min);

				$timerCtr.fadeIn('slow', 'swing');
				$breakMessage.fadeToggle('slow', 'swing');
			}, 500);

		}
		else if ($toggleBreak.prop('checked') === false) {

			console.log($toggleBreak.prop('checked') + ' if');
			//toggleBreak.removeProp('checked');

			$timerCtr.hide('slide', 'left', 'slow');


			setTimeout(function () {
				$('#pomo-slider').slider('value', 25);
				min = 25;
				$tMin.text(min);

				$timerCtr.show('slide', 'right', 'slow');

			}, 500);

		}

	};



	function completed() {
		var ref = db.ref('/derps/' + derpKey);

		if ($toggleBreak.is(':checked')) {
			$successHeader.text("Break's over, slacker!");
			$successSubhead.text("Ready to get back to work?")
			$dismiss.text("Let's derp this thing!");
			ref.update({ "breakCompleted": true });

		}
		else if (!$toggleBreak.is(':checked')) {
			$successHeader.text("Congrats!");
			$successSubhead.text("You completed another derp!")
			$dismiss.text("Take a breather");
			ref.update({ "derpCompleted": true });
		}

		$appDiv.fadeOut('slow', 'swing');
		$successDiv.delay('slow').fadeIn('slow', 'swing');
	};



	function dismissMessage() {

		if (!$toggleBreak.is(':checked')) {
			console.log($toggleBreak.is(':checked') + ' should be false');
			$toggleBreak.prop('checked', true);
			$slider.slider('value', 5);
			min = 5;
			$tMin.text(min);
			$breakMessage.show();
		}
		else if ($toggleBreak.is(':checked')) {
			console.log($toggleBreak.is(':checked') + ' should be true');
			$toggleBreak.removeProp('checked');
			$slider.slider('value', 25);
			min = 25;
			$tMin.text(min);
		}

		console.log($toggleBreak.is(':checked'));
		$pause.hide();
		$start.show();
		$slider.show();
		$toggleBtn.show();

		$successDiv.fadeOut('slow', 'swing');
		$appDiv.delay('slow').fadeIn('slow', 'swing');
	};




	$toggleBtn.click(function () {
		checkToggle();
	});




	$start.click(function () {
		initializeNewTimer();
	});




	$pause.click(function () {
		pauseCount();
	});




	$reset.click(function () {
		resetCount();
	});




	$dismiss.click(function () {
		dismissMessage();
	});



	/*
	 *
	 * MD5 HASH GENERATOR
	 * hat tip to Chris Coyier on CSS-Tricks.com
	 *
	 */

	var MD5 = function (string) {

		function RotateLeft(lValue, iShiftBits) {
			return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
		}

		function AddUnsigned(lX, lY) {
			var lX4, lY4, lX8, lY8, lResult;
			lX8 = (lX & 0x80000000);
			lY8 = (lY & 0x80000000);
			lX4 = (lX & 0x40000000);
			lY4 = (lY & 0x40000000);
			lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
			if (lX4 & lY4) {
				return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
			}
			if (lX4 | lY4) {
				if (lResult & 0x40000000) {
					return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
				} else {
					return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
				}
			} else {
				return (lResult ^ lX8 ^ lY8);
			}
		}

		function F(x, y, z) { return (x & y) | ((~x) & z); }
		function G(x, y, z) { return (x & z) | (y & (~z)); }
		function H(x, y, z) { return (x ^ y ^ z); }
		function I(x, y, z) { return (y ^ (x | (~z))); }

		function FF(a, b, c, d, x, s, ac) {
			a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
			return AddUnsigned(RotateLeft(a, s), b);
		};

		function GG(a, b, c, d, x, s, ac) {
			a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
			return AddUnsigned(RotateLeft(a, s), b);
		};

		function HH(a, b, c, d, x, s, ac) {
			a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
			return AddUnsigned(RotateLeft(a, s), b);
		};

		function II(a, b, c, d, x, s, ac) {
			a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
			return AddUnsigned(RotateLeft(a, s), b);
		};

		function ConvertToWordArray(string) {
			var lWordCount;
			var lMessageLength = string.length;
			var lNumberOfWords_temp1 = lMessageLength + 8;
			var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
			var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
			var lWordArray = Array(lNumberOfWords - 1);
			var lBytePosition = 0;
			var lByteCount = 0;
			while (lByteCount < lMessageLength) {
				lWordCount = (lByteCount - (lByteCount % 4)) / 4;
				lBytePosition = (lByteCount % 4) * 8;
				lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
				lByteCount++;
			}
			lWordCount = (lByteCount - (lByteCount % 4)) / 4;
			lBytePosition = (lByteCount % 4) * 8;
			lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
			lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
			lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
			return lWordArray;
		};

		function WordToHex(lValue) {
			var WordToHexValue = "", WordToHexValue_temp = "", lByte, lCount;
			for (lCount = 0; lCount <= 3; lCount++) {
				lByte = (lValue >>> (lCount * 8)) & 255;
				WordToHexValue_temp = "0" + lByte.toString(16);
				WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
			}
			return WordToHexValue;
		};

		function Utf8Encode(string) {
			string = string.replace(/\r\n/g, "\n");
			var utftext = "";

			for (var n = 0; n < string.length; n++) {

				var c = string.charCodeAt(n);

				if (c < 128) {
					utftext += String.fromCharCode(c);
				}
				else if ((c > 127) && (c < 2048)) {
					utftext += String.fromCharCode((c >> 6) | 192);
					utftext += String.fromCharCode((c & 63) | 128);
				}
				else {
					utftext += String.fromCharCode((c >> 12) | 224);
					utftext += String.fromCharCode(((c >> 6) & 63) | 128);
					utftext += String.fromCharCode((c & 63) | 128);
				}

			}

			return utftext;
		};

		var x = Array();
		var k, AA, BB, CC, DD, a, b, c, d;
		var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
		var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
		var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
		var S41 = 6, S42 = 10, S43 = 15, S44 = 21;

		string = Utf8Encode(string);

		x = ConvertToWordArray(string);

		a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

		for (k = 0; k < x.length; k += 16) {
			AA = a; BB = b; CC = c; DD = d;
			a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
			d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
			c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
			b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
			a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
			d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
			c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
			b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
			a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
			d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
			c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
			b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
			a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
			d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
			c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
			b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
			a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
			d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
			c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
			b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
			a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
			d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
			c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
			b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
			a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
			d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
			c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
			b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
			a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
			d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
			c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
			b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
			a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
			d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
			c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
			b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
			a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
			d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
			c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
			b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
			a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
			d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
			c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
			b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
			a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
			d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
			c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
			b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
			a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
			d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
			c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
			b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
			a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
			d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
			c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
			b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
			a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
			d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
			c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
			b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
			a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
			d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
			c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
			b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
			a = AddUnsigned(a, AA);
			b = AddUnsigned(b, BB);
			c = AddUnsigned(c, CC);
			d = AddUnsigned(d, DD);
		}

		var temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);

		return temp.toLowerCase();
	}




});