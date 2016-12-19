angular.module('tubenotes.watch', [])

.controller('WatchController', function($scope, $sce, $interval, AppFactory, GroupHandler, $location) {
  var startTime = 0;
  var intervalPromise;
  $scope.currentVideoTime = '00:00';
  $scope.noteTimestamp = '';
  $scope.groupList = GroupHandler.groups;
  $scope.groupName = $location.search().group;
  $scope.videoComments = AppFactory.currentVideo.comments;

  $scope.inGroupMode = function() {
    return !!$scope.groupName;
  };

  var initializeGroupComments = function() {
    GroupHandler.getGroupComments(GroupHandler.currentGroup.id, AppFactory.currentVideo.videoTableId)
    .then(function(data) {
      AppFactory.currentVideo.comments = data;
      $scope.videoComments = AppFactory.currentVideo.comments;
    });
  };
  if ($scope.inGroupMode()) {  //if in group mode, grab group comments
    initializeGroupComments();
  }

  // nav bar
  var navOpen = false;
  $scope.openNav = function() {
    document.getElementById('mySidenav').style.width = '350px';
    // uncomment below line 'Bookmark' will be pushed to the left
    document.getElementById('main').style.right = '230px';

    // uncomment below line the page background will change
    // document.body.style.backgroundColor = 'rgba(0,0,0,0.4)';
  };

  $scope.closeNav = function() {
    document.getElementById('mySidenav').style.width = '0';
    document.getElementById('main').style.right= '10px';
    document.body.style.backgroundColor = 'white';
  };

  // toggle the side bar
  $scope.toggleNav = function() {
    if (!navOpen) {
      $scope.openNav();
      navOpen = true;
    } else {
      $scope.closeNav();
      navOpen = false;
    }
  };

  // delete a note on the page and call deleteNote in app.js to send delete request to server
  $scope.deleteNote = function(comment) {
    // delete the comment from the page, comment is the comment object
    AppFactory.currentVideo.comments.forEach(function(savedComment, index) {
      if (comment.timestamp === savedComment.timestamp) {
        AppFactory.currentVideo.comments.splice(index, 1);
      }
    });
    if ($scope.inGroupMode()) {  //if in group mode, grab group comments
      (GroupHandler.deleteGroupComment(comment));
    } else {
      AppFactory.deleteNote(comment);
    }
  };

  var initializeAnnotation = function() {
    AppFactory.getAnnotation(AppFactory.currentVideo)
    .then(function(data) {
      console.log(data);
      storage = data;
    });
  };


  window.onYouTubeIframeAPIReady = function() {
    // append youtube iframe to html element with id of 'player'
    window.player = new YT.Player('player', {
      width: '800',
      height: '450',
      videoId: AppFactory.currentVideo.id || 'uxpDa-c-4Mc',
      events: {
        'onStateChange': onPlayerStateChange
      }
    });
    $scope.currentVideo = AppFactory.currentVideo;
    $('#c').css('z-index', '-10');
    if (AppFactory.currentVideo.annotation) {
      initializeAnnotation();
    }
  };

  // $scope.activeInterval = true;
  // $scope.pausedTime = null;
  $scope.isPaused = false;
  $scope.record = false;
  $scope.playback = false;

  window.onPlayerStateChange = function(event) {

    if (event.data === YT.PlayerState.PLAYING) {
      console.log('hit playing loop');
      $scope.isPaused = false;
      canvas.clear();
      $('#c').css('z-index', '10');


      // ON PLAYBACK MODE
      if ($scope.playback) {
        var currentIndex = Math.floor(player.getCurrentTime() * 1000 / interval);
        var i = currentIndex;

        if (storage[i]) {
          canvas.loadFromDatalessJSON(`${storage[i]}`).renderAll();
        }

        var playbackInterval = setInterval(function() {
          console.log('in playbackinterval');
          if (storage[i]) {
            canvas.loadFromDatalessJSON(`${storage[i]}`).renderAll();
          }
          i++;

          if (i === storage.length - 1 || $scope.isPaused) {
            clearInterval(playbackInterval);
            console.log('cleared playbackinterval');
          }
        }, interval);
      }


      // ON RECORD MODE
      if ($scope.record) {
        storage = storage || [];
        var j = Math.floor(player.getCurrentTime() * 1000 / interval); // current index
        console.log('j: ', j);
        var recordInterval = setInterval(function() {
            console.log('inside recordinterval');
            storage[j] = JSON.stringify(canvas.toDatalessJSON());
            console.log('storage[j]: ', storage[j]);
            j++;
            if ($scope.isPaused) {
              clearInterval(recordInterval);
              console.log('clear recordinterval');
              console.log('storage: ', storage);
            }
          }, interval);
      }
    } // end if PLAYING

    if (event.data === YT.PlayerState.PAUSED) {
      $scope.isPaused = true;
      console.log('storage', storage);
    }

    // when video is playing, show the video's time
    // on user's note taking window
    if (player) {
      if (event.data === YT.PlayerState.PLAYING) {
        console.log('interval: ', interval);
        var seconds = Math.floor(player.getCurrentTime());
        // convert timestamp in seconds to a mm:ss string
        $scope.currentVideoTime = $scope.formatTime(seconds);
        // update time on interval of 100ms (not ideal performance)
        intervalPromise = $interval(() =>
          ($scope.currentVideoTime =
              $scope.formatTime(Math.floor(player.getCurrentTime()))), 100);
      } else if (event.data === YT.PlayerState.ENDED ||
         event.data === YT.PlayerState.PAUSED) {
        // clear interval on video pause
        $interval.cancel(intervalPromise);
      }
    }
  };

  $scope.formatTime = function(seconds) {
    var minutes = Math.floor(seconds / 60);
    var seconds = seconds % 60;

    minutes = (minutes < 10) ? `0${minutes}`:`${minutes}`;
    seconds = (seconds < 10) ? `0${seconds}`:`${seconds}`;

    return `${minutes}:${seconds}`;
  };

  $scope.setTimestamp = function() {
    // only set time stamp on user's first input
    if (player) {
      if ($scope.userNote.note.$pristine) {
        startTime = Math.floor(player.getCurrentTime());
        $scope.noteTimestamp = $scope.formatTime(startTime);
      }
    }
  };

  $scope.resetNote = function() {
    // empty input fields
    $scope.note = '';

    // reset $pristine flags on form
    $scope.userNote.note.$setPristine();

    // reset startTime and $scope.noteTimestamp to initial values
    startTime = 0;
    $scope.noteTimestamp = '';
  };

  $scope.postNote = function(note) {
    // add note to current video's comments array
    AppFactory.currentVideo.comments.push(
      { text: note,
        timestamp: startTime,
        username: AppFactory.username }
    );
     // update scope variable to make comments render on page
    $scope.videoComments = AppFactory.currentVideo.comments;
    // call update to server for the current video
    if ($scope.inGroupMode()) {
      GroupHandler.postGroupComment(GroupHandler.currentGroup.id, note, startTime);
    } else {
      AppFactory.addNote(note, startTime);
    }
    $scope.resetNote();
  };

  $scope.clickNote = function(comment) {
    // when note is clicked
    // start playing video at note's timestamp
    if (window.player) {
      window.player.seekTo(comment.timestamp, true);
    }
  };

  $scope.postGroupVid = function(groupname) {
    GroupHandler.postGroupVid(groupname, AppFactory.currentVideo)
    .then(function(data) {
      GroupHandler.transferGroupComments($scope.videoComments, data[0].GroupId);
    });
  };






   var _ = function(id){return document.getElementById(id)};


   var canvas = this.__canvas = new fabric.Canvas('c', {
     isDrawingMode: true
   });

   //moved storage variable above
   // var storage = [];
   var interval = 500;
  // Canvas overlay function, invoked at the end to render
  (function() {
     var _ = function(id) {return document.getElementById(id)};

     fabric.Object.prototype.transparentCorners = false;

     var drawingModeEl = _('drawing-mode'),
         drawingOptionsEl = _('drawing-mode-options'),
         drawingColorEl = _('drawing-color'),
         drawingLineWidthEl = _('drawing-line-width'),
         clearEl = _('clear-canvas'),
         saveEl = _('save-canvas'),
         replayEl = _('replay-canvas'),
         recordEl = _('record'),
         playbackEl = _('playback');

     clearEl.onclick = function() { canvas.clear() };

    recordEl.onclick = function() {
      $scope.record = !$scope.record;
      console.log('$scope.record: ', $scope.record);
      if (!$scope.record) {
        recordEl.innerHTML = 'Record Annotations';
        $('#playback').attr('disabled', false);
        $('#replay-canvas').attr('disabled', false);
        player.pauseVideo();
      } else {
        recordEl.innerHTML = 'Stop Recording';
        $('#playback').attr('disabled', true);
        $('#replay-canvas').attr('disabled', true);
        player.pauseVideo();
        player.playVideo();
      }
      if ($('#recButton').hasClass('notRec')) {
        $('#recButton').removeClass("notRec");
        $('#recButton').addClass("Rec");
      } else{
        $('#recButton').removeClass("Rec");
        $('#recButton').addClass("notRec");
      }
    };

    playbackEl.onclick = function() {
      $scope.playback = !$scope.playback;
      console.log('$scope.playback: ', $scope.playback);
      if (!$scope.playback) {
        playbackEl.innerHTML = 'Show Annotations';
        $('#record').attr('disabled', false);
        player.pauseVideo();
      } else {
        playbackEl.innerHTML = 'Hide Annotations';
        $('#record').attr('disabled', true);
        player.pauseVideo();
        player.playVideo();
      }
    }

     drawingColorEl.onchange = function() {
       canvas.freeDrawingBrush.color = this.value;
     };

     drawingLineWidthEl.onchange = function() {
       canvas.freeDrawingBrush.width = parseInt(this.value, 10) || 1;
       this.previousSibling.innerHTML = this.value;
     };

    saveEl.onclick = function() {
      // Save to database
      console.log('storage: ', storage);
      $.ajax({
        url: '/uploadAnnotation',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(storage),
        success: function() {
          console.log('successfully saved');
        }
      });

    }

    replayEl.onclick = function() {
      canvas.clear();
      player.seekTo(0, true);
      player.playVideo();

    }

    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = drawingColorEl.value;
      canvas.freeDrawingBrush.width = parseInt(drawingLineWidthEl.value, 10) || 1;
      canvas.freeDrawingBrush.shadowBlur = 0;
    }
  })()

});