// =============================
// = WARNING: EPIC HACKTACULAR =
// =============================

(function () {
  'use strict';

  // Clear any existing widgets
  $('.intuition-application').remove();

  var setUp = function () {
    window.intuitionApplicationInitialized = true;

    angular.module('intuition', [])

    .controller('roleStriker', ['$scope', function ($scope) {
			var isLeftClick = function (clickEvent) {
				return clickEvent && clickEvent.which === 1;
			};

			var isRightClick = function (clickEvent) {
				return clickEvent && clickEvent.which === 3;
			};

			var createPlayer = function (playerNumber) {
				return {
					number: playerNumber,
					// The information being intuited from their in game chatter
					// One of: null, 'mafiaAlly', 'chatty', 'mafiaesque'
					talkingSignal: null,
					// The yay/nay bring to the stand votes (playerNumber => isYayVote)
					trialVotes: {},
					// The yay/nay lynch votes (playerNumber => isYayVote)
					lynchVotes: {}
				};
			};

			var initializePlayers = function () {
				$scope.selectedPlayer = null;
				$scope.players = _.map(_.range(0, 15), function (number) {
					return createPlayer(number);
				});
				// A temporary store for the in-progress voting to put someone
				// up on the stand.
				$scope.trialVotes = {};
			};

			var clearPlayer = function (player) {
				$scope.players[player.number] = createPlayer(player.number);
			};

      $scope.alignmentMode = false;

      $scope.toggleAlignmentMode = function (event) {
        // if it's a right click
        if (event.which === 3) {
          $scope.alignmentMode = !$scope.alignmentMode;
					initializePlayers();
        }
      };

			// Set the player being edited to the given player,
			// or exit edit mode if the player being edited has
			// their edit button clicked again.
			var selectPlayer = function (player) {
				if (player && player !== $scope.selectedPlayer) {
					$scope.selectedPlayer = player;
				} else {
					$scope.selectedPlayer = null;
				}
				// Clear any trial votes, since selecting a player
				// before saving them to the player's record indicates
				// the vote failed to bring them to the stand
				$scope.trialVotes = {};
			};

			this.selectOrClearPlayer = function (clickEvent, player) {
				// Select player
				if (isLeftClick(clickEvent)) {
					selectPlayer(player);
				}
				else if (isRightClick(clickEvent)) {
					clearPlayer(player);
					selectPlayer(null);
				}
			};

			var markTrialVote = function (clickEvent, player, isSelectedPlayer) {
				// Mark that this player has nominated/voted
				if (!isSelectedPlayer) {
					// A vote to the stand and the player is the voter
					if (isLeftClick(clickEvent)) {
						$scope.trialVotes[player.number] = true;
					}
					// Record the abstainers to this player's profile, since they've
					// now been put up on the stand, then select this player so
					// trial votes can be viewed and lynching votes can be noted.
					else if (isRightClick(clickEvent)) {
						player.trialVotes = $scope.trialVotes;
						
						// Clear the lynch votes as we're now about to edit them
						player.lynchVotes = {};

						selectPlayer(player);
					}
				}
			};
			
			var markOrClearVote = function (votesMap, playerNumber, voteValue) {
				if (!votesMap[playerNumber]) {
					votesMap[playerNumber] = voteValue;
				} else if (votesMap[playerNumber] === voteValue) {
					votesMap[playerNumber] = null;
				}
			};

			var markLynchVote = function (clickEvent, selectedPlayer, votingPlayer, isSelectedPlayer) {
				if (!isSelectedPlayer) {
					// A deliberate abstain and the player is the voter
					if (isLeftClick(clickEvent)) {
						markOrClearVote(selectedPlayer.lynchVotes, votingPlayer.number, 'abstain')
					} else if (isRightClick(clickEvent)) {
						markOrClearVote(selectedPlayer.lynchVotes, votingPlayer.number, 'lynch')
					}
				} else {
					if (isRightClick(clickEvent)) {
						selectPlayer(null);
					}
				}
			};

			this.markVote = function (clickEvent, player, isAPlayerSelected, players) {
				var isTheSelectedPlayer =
						player.number === ($scope.selectedPlayer && $scope.selectedPlayer.number);

				if (!isAPlayerSelected) {
					markTrialVote(clickEvent, player, isTheSelectedPlayer);
				} else {
					markLynchVote(clickEvent, $scope.selectedPlayer, player, isTheSelectedPlayer);
				}
			};
			
			this.hasTrialData = function (player) {
				return player && _.any(player.trialVotes, _.identity);
			};

			this.markTalkingSignal = function (clickEvent, player) {
				console.log(clickEvent, player);
				if (isRightClick(clickEvent)) {
					if (player.talkingSignal === null) {
						player.talkingSignal = 'mafiaAlly';
					} else if (player.talkingSignal === 'mafiaAlly') {
						player.talkingSignal = null;
					} else if (player.talkingSignal === 'chatty') {
						player.talkingSignal = 'mafiaesque';
					} else {
						player.talkingSignal = null;
					}
				}
				else if (isLeftClick(clickEvent)) {
					if (player.talkingSignal === null) {
						player.talkingSignal = 'chatty';
					} else {
						player.talkingSignal = null;
					}
				}
			};

			initializePlayers();
    }])


    // Add the widgets to the page then Bootstrap the app
    var roleStrikerWidget = $(
        '<div class="role-striker-container" ng-controller="roleStriker as playerController" ng-class="{\'alignment-mode\': alignmentMode}">' +
          '<div class="drag-handle" ng-mousedown="toggleAlignmentMode($event)"></div>' +
          '<div class="players">' +
            '<div class="player" ng-repeat="player in players" ng-class="{\'editable\': selectedPlayer !== null, \'has-trial-data\': playerController.hasTrialData(player), \'abstained-from-voting-for-selected-player\': selectedPlayer && playerController.hasTrialData(selectedPlayer) && !selectedPlayer.trialVotes[player.number], \'player-being-edited\': player === selectedPlayer, \'is-dead\': player.isDead, \'is-suspicious\': player.isSuspicious, \'is-town\': player.alignment === \'town\', \'is-mafia\': player.alignment === \'mafia\'}">' +
							'<div class="player-control player-number" ng-mousedown="playerController.selectOrClearPlayer($event, player)"></div>' +
              '<div class="player-behavior player-talk" ng-class="{\'is-chatty\': player.talkingSignal === \'chatty\', \'is-mafia-ally\': player.talkingSignal === \'mafiaAlly\', \'is-mafiaesque\': player.talkingSignal === \'mafiaesque\'}" ng-mousedown="playerController.markTalkingSignal($event, player)"></div>' +
              '<div class="player-behavior player-vote" ng-class="{\'has-voted-up\': trialVotes[player.number], \'has-voted-lynch\': selectedPlayer.lynchVotes[player.number] === \'lynch\', \'has-abstained-from-lynch-vote\': selectedPlayer.lynchVotes[player.number] === \'abstain\'}" ng-mousedown="playerController.markVote($event, player, selectedPlayer, players)"></div>' +
            '</div>' +
          '</div>' +
        '</div>'
    );

    var application = $('<div />', {
      'class': 'intuition-application'
    });

    application.append(roleStrikerWidget);

    $(document.body).append(application);

    // Bootstrap angular onto the widget
    angular.bootstrap(application, ['intuition']);

    // OLD SHIT
    // ================================

    $(document.body).attr('oncontextmenu', 'return false;');

    // Style the widget
    $('.role-striker-container').css({
      position: 'absolute',
      top: parseFloat(window.localStorage.getItem('containerTop'), 10) || 0,
      left: parseFloat(window.localStorage.getItem('containerLeft'), 10) || 0,
      width: parseFloat(window.localStorage.getItem('containerWidth'), 10) || 80,
      height: parseFloat(window.localStorage.getItem('containerHeight'), 10) || 200,
    }).draggable({
      'handle': '.drag-handle',
      'stop': function() {
        window.localStorage.setItem('containerTop', $(this).offset().top);
        window.localStorage.setItem('containerLeft', $(this).offset().left);
      }
    }).resizable({
      'stop': function() {
        window.localStorage.setItem('containerWidth', $(this).width());
        window.localStorage.setItem('containerHeight', $(this).height());
      }
    });
  };

  if (!window.intuitionApplicationInitialized) {
    // Load the libraries and initialize
    $.getScript('https://code.jquery.com/ui/1.11.2/jquery-ui.min.js', function () {
      $('<link/>', {
        rel: 'stylesheet',
        type: 'text/css',
        href: 'https://code.jquery.com/ui/1.11.2/themes/black-tie/jquery-ui.css'
      }).appendTo('head');
      $('<link/>', {
        rel: 'stylesheet',
        type: 'text/css',
        // TODO: CHANGE BEFORE LOCAL DEV!!!!!!!!!!!!!!!!!
        href: 'http://true-reality.net/cdn/salem.css'
        // href: 'http://localhost:8777/salem.css'
      }).appendTo('head');

      // Kick it off
      $.getScript('https://ajax.googleapis.com/ajax/libs/angularjs/1.3.11/angular.min.js',
          function () {
            $.getScript('https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore-min.js',
                setUp);
          }
      );
    });
  } else {
    setUp();
  }
}());
