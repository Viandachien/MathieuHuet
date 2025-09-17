// Player Management
let players = {};
let playbackStates = {};

// Initialize YouTube API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function onYouTubeIframeAPIReady() {
    const playerIds = ['bionik', 'watchdogs', 'farcry', 'wd2', 'wd2player'];
    playerIds.forEach(id => {
        players[id] = new YT.Player(`player-${id}`, {
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    });
}

function onPlayerReady(event) {
    const playerId = event.target.getIframe().id.split('-')[1];
    setupTimestampNavigation(playerId);
    setupThumbnailHandler(playerId);
    setupVideoClickHandler(playerId);
}

function setupVideoClickHandler(playerId) {
    const videoPlaceholder = document.querySelector(`.video-placeholder[data-player="${playerId}"]`);
    if (!videoPlaceholder) return;

    videoPlaceholder.addEventListener('click', (e) => {
        // Don't handle clicks on thumbnail or timestamp nav
        if (e.target.closest('.custom-thumbnail') || e.target.closest('.timestamp-nav')) {
            return;
        }

        // Reset to default state
        if (players[playerId].currentInterval) {
            clearInterval(players[playerId].currentInterval);
            players[playerId].currentInterval = null;
        }

        clearActiveTimestamps(playerId);
        players[playerId].pauseVideo();
        playbackStates[playerId] = 'paused';

        const thumbnail = document.querySelector(`.custom-thumbnail[data-player="${playerId}"]`);
        if (thumbnail) {
            thumbnail.classList.remove('hidden');
            players[playerId].thumbnailHidden = false;
        }
    });
}

function onPlayerStateChange(event) {
    const playerId = event.target.getIframe().id.split('-')[1];
    playbackStates[playerId] = event.data === YT.PlayerState.PAUSED ? 'paused' : 'playing';
}

function setupTimestampNavigation(playerId) {
    document.querySelectorAll(`.timestamp-nav[data-player="${playerId}"] a`).forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const startTime = parseInt(e.target.dataset.timestamp);
            const endTime = parseInt(e.target.dataset.end);
            
            if (isNaN(startTime)) return;
            
            const thumbnail = document.querySelector(`.custom-thumbnail[data-player="${playerId}"]`);
            if (thumbnail && !thumbnail.classList.contains('hidden')) {
                thumbnail.classList.add('hidden');
                players[playerId].thumbnailHidden = true;
            }

            clearActiveTimestamps(playerId);
            if (players[playerId].currentInterval) {
                clearInterval(players[playerId].currentInterval);
            }

            e.target.classList.add('active');
            
            players[playerId].seekTo(startTime);
            players[playerId].playVideo();
            playbackStates[playerId] = 'playing';

            if (!isNaN(endTime)) {
                players[playerId].currentInterval = setInterval(() => {
                    if (!players[playerId]) return;
                    
                    const currentTime = players[playerId].getCurrentTime();
                    if (currentTime >= endTime) {
                        clearInterval(players[playerId].currentInterval);
                        
                        const timestamps = Array.from(document.querySelectorAll(`.timestamp-nav[data-player="${playerId}"] a`));
                        const currentIndex = timestamps.indexOf(e.target);
                        
                        if (currentIndex < timestamps.length - 1) {
                            timestamps[currentIndex + 1].click();
                        } else {
                            clearActiveTimestamps(playerId);
                            players[playerId].pauseVideo();
                            
                            if (thumbnail) {
                                thumbnail.classList.remove('hidden');
                                players[playerId].thumbnailHidden = false;
                            }
                        }
                    }
                }, 200);
            }
        });
    });
}

function setupThumbnailHandler(playerId) {
    const thumbnail = document.querySelector(`.custom-thumbnail[data-player="${playerId}"]`);
    if (!thumbnail) return;

    thumbnail.addEventListener('click', () => {
        thumbnail.classList.add('hidden');
        players[playerId].thumbnailHidden = true;

        const firstTimestamp = document.querySelector(`.timestamp-nav[data-player="${playerId}"] a`);
        if (firstTimestamp) {
            firstTimestamp.click();
        } else {
            players[playerId].playVideo();
        }
    });
}

function clearActiveTimestamps(playerId) {
    document.querySelectorAll(`.timestamp-nav[data-player="${playerId}"] a`)
        .forEach(link => link.classList.remove('active'));
}