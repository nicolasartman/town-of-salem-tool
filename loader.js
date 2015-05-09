// Loader for the town of salem tool.
// This is what gets run by the bookmarklet,
// and it loads in everything else.

(function () {
  'use strict';
	var sourceUrl = window.location.href.indexOf('localhost') !== -1 ?
		'/salem.js' : 'http://nicolasartman.com/salem/salem.js';
	
	// Load the libraries and initialize
	
	if (!window.salemToolLibrariesFetched) {
		// Load the libraries and initialize
		
		// Doesn't really matter when the CSS arrives
		$('<link/>', {
			rel: 'stylesheet',
			type: 'text/css',
			href: 'https://code.jquery.com/ui/1.11.2/themes/black-tie/jquery-ui.css'
		}).appendTo('head');
		$('<link/>', {
			rel: 'stylesheet',
			type: 'text/css',
			href: window.location.href.indexOf('localhost') !== -1 ?
				'/salem.css' :
				'http://true-reality.net/cdn/salem.css'
		}).appendTo('head');
		
		// The town of salem page already has jquery in it, so we don't need to load that
		$.when(
			$.getScript('https://code.jquery.com/ui/1.11.2/jquery-ui.min.js'),
			$.getScript('https://ajax.googleapis.com/ajax/libs/angularjs/1.3.11/angular.min.js'),
			$.getScript('https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore-min.js')
		).then(function () {
			return $.getScript(sourceUrl);
		}).then(function () {
			window.salemToolLibrariesFetched = true;
			window.runTownOfSalemTool()
		});
	} else {
		window.runTownOfSalemTool();
	}
	
}());
