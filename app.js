/* global $ */
/* global noUISlider */

$( document ).ready(function() {
   
   $.material.init();
   
   var min = 25; // pomodoro timer minutes initialized at 25
   var sec = 0; // pomodoro timer seconds
   var active = false; // flags whether pomodoro timer is running
   var paused = false;
   var complete = false;
   
   var intv;
   
   var appDiv = $( '#app-container' );
   var timerCtr = $( '#timectr' );
   var successDiv = $( '#success-container' );
   
   var tMin = $( '#timer-minutes' );
   var tSec = $( '#timer-seconds' );
   var timer = $( '.main-timer' );
   
   var start = $( '#startbt' );
   var pause = $( '#pausebt' );
   var reset = $( '#resetbt' );
   var toggleBtn = $( '#toggleBtn' );
   var toggleBreak = $( '#break-mode' );
   
   var breakMessage = $( '#break-message' );
   var successHeader = $( '#success-message-header' );
   var successSubhead = $( '#success-message-subhead' );
   var dismiss = $( '#dismiss' );
   
   
   // Slider to set timer minutes
   var slider = $( '#pomo-slider' ).slider({
      animate: 'slow',
      max: 50,
      min: 1,
      value: 25,
      slide: function(event, ui) {
         min = ui.value;
         tMin.text(min);
      }
   });
   
   
   function pauseCount() {
            
         clearInterval(intv);
         
         pause.fadeOut('slow','swing');
         start.delay('slow').fadeIn('slow','swing');
         reset.delay('slow').fadeIn('slow','swing');
      };
         
         
         
   function resetCount() {
      
      if (!toggleBreak.is(':checked')) {
         min = 25;
      }
      else if (toggleBreak.is(':checked')) {
         min = 5;
      }
      
      sec = 0;
      
      tMin.text(min);
      tSec.text(checkTime(sec));
      
      reset.fadeOut('slow','swing');
      start.fadeOut('slow','swing');
      slider.delay('slow').fadeIn('slow','swing');
      start.delay('slow').fadeIn('slow','swing');
      toggleBtn.delay('slow').delay('slow').fadeIn('slow','swing');
   };
   
   
   
   function checkTime(i) {
      if (i < 10) {
         i = '0' + i;
      }
      return i;
   };
   
   
   
   function countDown() {
      
      start.fadeOut('slow','swing');
      pause.delay('slow').fadeIn('slow','swing');
      slider.fadeOut('slow','swing');
      toggleBtn.fadeOut('slow','swing');
      reset.fadeOut('slow','swing');
      
      intv = setInterval(function() {
         if (sec === 0) {
            sec = 59;
            min = min - 1;
         }
         else {
            sec = sec - 1;
         }
         
         tMin.text(checkTime(min));
         tSec.text(checkTime(sec));
         
         if (min === 0 && sec === 0) {
            clearInterval(intv);
            completed();
         }
      }, 1000);
   };
      
   
   
   
   
   function checkToggle() {
      
      if (toggleBreak.prop('checked')) {
         console.log(toggleBreak.prop('checked') + ' else');
         //toggleBreak.prop('checked');
         timerCtr.hide('slide','left','slow');
         
         setTimeout(function() {
            $( '#pomo-slider' ).slider('value', 5);
           // $( '#pomo-slider' ).slider('option', 'max', 25);
            
            min = 5;
            tMin.text(min);
            
            timerCtr.fadeIn('slow','swing');
            breakMessage.fadeToggle('slow','swing');
         }, 500);
         
      }
      else if (toggleBreak.prop('checked') === false) {
         
         console.log(toggleBreak.prop('checked') + ' if');
         //toggleBreak.removeProp('checked');
         
         timerCtr.hide('slide','left','slow');

         
         setTimeout(function() {
            $( '#pomo-slider' ).slider('value', 25);
            min = 25;
            tMin.text(min);
            
            timerCtr.show('slide','right','slow');
            
         }, 500);
         
      }
      
   };
   
   
   
   function completed() {
      
      if (toggleBreak.is(':checked')) {
         successHeader.text("Break's over, slacker!");
         successSubhead.text("Ready to get back to work?")
         dismiss.text("Let's derp this thing!");
      }
      else if (!toggleBreak.is(':checked')) {
         successHeader.text("Congrats!");
         successSubhead.text("You completed another derp!")
         dismiss.text("Take a breather");
      }
      
      appDiv.fadeOut('slow','swing');
      successDiv.delay('slow').fadeIn('slow','swing');
   }
   
   
   
   function dismissMessage() {
      
      if (!toggleBreak.is(':checked')) {
         console.log(toggleBreak.is(':checked') + ' should be false');
         toggleBreak.prop('checked',true);
         slider.slider('value', 5);
         min = 5;
         tMin.text(min);
         breakMessage.show();
      }
      else if (toggleBreak.is(':checked')) {
         console.log(toggleBreak.is(':checked') + ' should be true');
         toggleBreak.removeProp('checked');
         slider.slider('value', 25);
         min = 25;
         tMin.text(min);
      }
      
      console.log(toggleBreak.is(':checked'));
      pause.hide();
      start.show();
      slider.show();
      toggleBtn.show();
      
      successDiv.fadeOut('slow','swing');
      appDiv.delay('slow').fadeIn('slow','swing');
   };
   
   toggleBtn.click(function() {
      checkToggle();
   });
   
   start.click(function() {
      countDown();
   });
   
   pause.click(function() {
      pauseCount();
   });
   
   reset.click(function() {
      resetCount();
   });
   
   dismiss.click(function() {
      dismissMessage();
   });
   
});