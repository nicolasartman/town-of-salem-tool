// =============================
// = WARNING: EPIC HACKTACULAR =
// =============================

(function () {
	'use strict';

	// Clear any existing widgets
	$('.salem-tool-application').remove();

	var setUp = function () {
		angular.module('salemTool', [])

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
						$scope.trialVotes[player.number] = !$scope.trialVotes[player.number];
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
						markOrClearVote(selectedPlayer.lynchVotes, votingPlayer.number, 'abstain');
					} else if (isRightClick(clickEvent)) {
						markOrClearVote(selectedPlayer.lynchVotes, votingPlayer.number, 'lynch');
					}
				} else {
					if (isRightClick(clickEvent)) {
						selectPlayer(null);
					}
				}
			};

			this.markVote = function (clickEvent, player, isAPlayerSelected) {
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
		}]);


		// Add the widgets to the page then Bootstrap the app
		var coreWidget = $(
				'<div class="salem-tool-container" ng-controller="roleStriker as playerController" ng-class="{\'alignment-mode\': alignmentMode}">' +
					'<div class="drag-handle" ng-mousedown="toggleAlignmentMode($event)"></div>' +
					'<div class="players">' +
						'<div class="player" ng-repeat="player in players" ng-class="{\'has-trial-data\': playerController.hasTrialData(player), \'abstained-from-voting-for-selected-player\': selectedPlayer && playerController.hasTrialData(selectedPlayer) && !selectedPlayer.trialVotes[player.number], \'selected\': player === selectedPlayer}">' +
							'<div class="player-control player-number" ng-mousedown="playerController.selectOrClearPlayer($event, player)"></div>' +
							'<div class="player-behavior player-talk" ng-class="{\'is-chatty\': player.talkingSignal === \'chatty\', \'is-mafia-ally\': player.talkingSignal === \'mafiaAlly\', \'is-mafiaesque\': player.talkingSignal === \'mafiaesque\'}" ng-mousedown="playerController.markTalkingSignal($event, player)"></div>' +
							'<div class="player-behavior player-vote" ng-class="{\'has-voted-up\': trialVotes[player.number], \'has-voted-lynch\': selectedPlayer.lynchVotes[player.number] === \'lynch\', \'has-abstained-from-lynch-vote\': selectedPlayer.lynchVotes[player.number] === \'abstain\'}" ng-mousedown="playerController.markVote($event, player, selectedPlayer, players)"></div>' +
						'</div>' +
					'</div>' +
				'</div>'
		);

		var applicationElement = $('<div />', {
			'class': 'salem-tool-application'
		});

		applicationElement.append(coreWidget);

		$(document.body).append(applicationElement);

		// Bootstrap angular onto the widget
		angular.bootstrap(applicationElement, ['salemTool']);


		// TODO: refactor
		
		// The town of salem site doesn't use right clicks at all, so it's safe to just
		// disable the context menu completely so we can use the clicks for our own
		// interface and not have to worry about accidental context menu triggering.
		$(document.body).attr('oncontextmenu', 'return false;');

		// Remember widget position and allow dragging and resizing
		$('.salem-tool-container').css({
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
	
	// Add hook for loader script
	window.runTownOfSalemTool = setUp;
}());
