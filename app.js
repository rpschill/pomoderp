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


    var user = null;
    var currAuth = false;




	// Watch Firebase auth object for changes
	function authObserver() {
		firebase.auth().onAuthStateChanged(function(fbUser) {
			// TODO Define views based on auth state?
			if (fbUser) {
				currAuth = true;
				console.log(fbUser);
				user = fbUser.uid;
				appView();
			}
			else {
				currAuth = false;
				console.log('no auth');
				user = null;
				noAuthView();
			}
		});
	}

	authObserver();





    // Auth functions

    function registerUser() {
    	var email = $('#register-email').val();
		var password = $('#register-password').val();
        firebase.auth().createUserWithEmailAndPassword(email, password)
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
					active: false,
					activeDerp: '',
					completedCount: 0
				};
				db.ref('users/' + uid).update(updates);
			})
    }



    function signIn() {
        var email = $loginEmail.val();
        var password = $loginPassword.val();
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then(function(user, error) {
            	var errorCode = error.code;
				var errorMessage = error.message;
				console.log(errorCode + ': ' + errorMessage);
				appView();
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

	var derpRef = db.ref('derps');


	var sliderMin = 25; // pomodoro timer minutes initialized at 25
	var sliderSec = 0; // pomodoro timer seconds
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


	// Slider to set timer minutes
	var $slider = $('#pomo-slider').slider({
		animate: 'slow',
		max: 50,
		min: 1,
		value: 25,
		slide: function (event, ui) {
			sliderMin = ui.value;
			$tMin.text(sliderMin);
		}
	});



	function createNewDerp(user, sliderMin) {

		// A new derp entry
		var newDerpData = {
			min: sliderMin,
			sec: 0,
			bothCompleted: false,
			breakCompleted: false,
			derpCompleted: false,
			breakActive: false
		};

		// Get key for new derp
		var newDerpKey = derpRef.push().key()

		// Write new derp's data to db and add derp's UID to user
		var updates = {};
		updates['/derps/' + newDerpKey] = newDerpData;
		updates['/derps/' + newDerpKey + '/' + user] = true;
		updates['/users/' + user + '/' + newDerpKey] = true;

		return db.ref().update(updates);
	}



	function pauseCount() {

		clearInterval(intv);

		$pause.fadeOut('slow', 'swing');
		$start.delay('slow').fadeIn('slow', 'swing');
		$reset.delay('slow').fadeIn('slow', 'swing');
	};



	function resetCount() {

		if (!$toggleBreak.is(':checked')) {
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



	function countDown() {

		$start.fadeOut('slow', 'swing');
		$pause.delay('slow').fadeIn('slow', 'swing');
		$slider.fadeOut('slow', 'swing');
		$toggleBtn.fadeOut('slow', 'swing');
		$reset.fadeOut('slow', 'swing');

		createNewDerp();

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

		if ($toggleBreak.is(':checked')) {
			$successHeader.text("Break's over, slacker!");
			$successSubhead.text("Ready to get back to work?")
			$dismiss.text("Let's derp this thing!");
		}
		else if (!$toggleBreak.is(':checked')) {
			$successHeader.text("Congrats!");
			$successSubhead.text("You completed another derp!")
			$dismiss.text("Take a breather");
		}

		$appDiv.fadeOut('slow', 'swing');
		$successDiv.delay('slow').fadeIn('slow', 'swing');
	}



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
		countDown();
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

});