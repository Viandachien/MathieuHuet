// YouTube Player Management
let players = {};
let playbackStates = {};

// Initialize YouTube API
function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// YouTube Player Initialization
function onYouTubeIframeAPIReady() {
    const playerIds = ['farcry', 'watchdogs', 'bionik', 'wd2'];
    
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
}

function onPlayerStateChange(event) {
    const playerId = event.target.getIframe().id.split('-')[1];
    
    if (event.data === YT.PlayerState.PAUSED) {
        playbackStates[playerId] = 'paused';
        clearInterval(players[playerId].currentInterval);
    }
}

// Timestamp Navigation Setup
function setupTimestampNavigation(playerId) {
    const timestamps = document.querySelectorAll(`.timestamp-nav[data-player="${playerId}"] a`);
    
    timestamps.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const startTime = parseInt(e.target.dataset.timestamp);
            const endTime = parseInt(e.target.dataset.end);
            
            if (isNaN(startTime)) return;
            
            clearActiveTimestamps(playerId);
            e.target.classList.add('active');
            
            // Hide thumbnail if visible
            const thumbnail = document.querySelector(`.custom-thumbnail[data-player="${playerId}"]`);
            if (thumbnail && !thumbnail.classList.contains('hidden')) {
                thumbnail.classList.add('hidden');
                players[playerId].thumbnailHidden = true;
            }

            players[playerId].seekTo(startTime);
            players[playerId].playVideo();

            if (!isNaN(endTime)) {
                await waitForSectionEnd(playerId, endTime);
                e.target.classList.remove('active');
                players[playerId].pauseVideo();
            }
        });
    });
}

// Thumbnail Handler Setup
function setupThumbnailHandler(playerId) {
    const thumbnail = document.querySelector(`.custom-thumbnail[data-player="${playerId}"]`);
    if (!thumbnail) return;

    thumbnail.addEventListener('click', async () => {
        thumbnail.classList.add('hidden');
        players[playerId].thumbnailHidden = true;

        const timestamps = Array.from(document.querySelectorAll(`.timestamp-nav[data-player="${playerId}"] a`));
        if (timestamps.length === 0) {
            players[playerId].playVideo();
            return;
        }

        for (const timestamp of timestamps) {
            if (playbackStates[playerId] === 'paused') break;
            
            const startTime = parseInt(timestamp.dataset.timestamp);
            const endTime = parseInt(timestamp.dataset.end);
            
            if (isNaN(startTime) || isNaN(endTime)) continue;

            clearActiveTimestamps(playerId);
            timestamp.classList.add('active');
            
            players[playerId].seekTo(startTime);
            players[playerId].playVideo();

            await waitForSectionEnd(playerId, endTime);
            timestamp.classList.remove('active');
        }
    });
}

// Helper Functions
function clearActiveTimestamps(playerId) {
    document.querySelectorAll(`.timestamp-nav[data-player="${playerId}"] a`)
        .forEach(link => link.classList.remove('active'));
}

function waitForSectionEnd(playerId, endTime) {
    return new Promise((resolve) => {
        const checkTime = setInterval(() => {
            if (playbackStates[playerId] === 'paused') {
                clearInterval(checkTime);
                resolve();
                return;
            }
            
            const currentTime = players[playerId].getCurrentTime();
            if (currentTime >= endTime) {
                clearInterval(checkTime);
                resolve();
            }
        }, 1000);
        players[playerId].currentInterval = checkTime;
    });
}

// Setup functions
function setupThumbnailHandlers() {
    const playerIds = ['farcry', 'watchdogs', 'bionik', 'wd2'];
    playerIds.forEach(id => setupThumbnailHandler(id));
}

function setupProjectCardAnimations() {
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadYouTubeAPI();
});