document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const audio = document.getElementById("audio");
  const albumArt = document.getElementById("album-art");
  const songTitle = document.getElementById("song-title");
  const songArtist = document.getElementById("song-artist");
  const prevBtn = document.getElementById("prev");
  const playBtn = document.getElementById("play");
  const nextBtn = document.getElementById("next");
  const progressContainer = document.getElementById("progress-container");
  const progress = document.getElementById("progress");
  const currentTimeEl = document.getElementById("current-time");
  const durationEl = document.getElementById("duration");
  const loopBtn = document.getElementById("loop");
  const speedBtn = document.getElementById("speed");
  const playlistEl = document.getElementById("playlist");

  // Player State
  let songs = [];
  let currentSongIndex = 0;
  let isPlaying = false;
  let loopState = 0; // 0: no loop, 1: loop all, 2: loop one
  const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  let currentSpeedIndex = 2; // Default 1x

  const DEFAULT_ALBUM_ART =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAEERJ0NNdpsJFUwVUTHwjTn43cYHMVkR3_g&usqp=CAU"; // A simple default image

  // --- Core Functions ---

  // Fetch songs from JSON
  async function getSongs() {
    try {
      const res = await fetch("songs.json");
      const data = await res.json();
      songs = data.songs;
      renderPlaylist();
      loadSong(songs[currentSongIndex]);
    } catch (error) {
      console.error("Failed to load songs:", error);
      songTitle.textContent = "Error loading songs";
    }
  }

  // Load song details into the UI
  function loadSong(song) {
    songTitle.textContent = song.title;
    songArtist.textContent = song.artist;
    audio.src = song.audioSrc;
    albumArt.src = song.imageSrc || DEFAULT_ALBUM_ART;
    albumArt.onerror = () => {
      albumArt.src = DEFAULT_ALBUM_ART;
    }; // Fallback if image link is broken
    updatePlaylistActiveState();
  }

  // Play and Pause
  function playSong() {
    isPlaying = true;
    playBtn.querySelector("i.fas").classList.replace("fa-play", "fa-pause");
    audio.play();
  }

  function pauseSong() {
    isPlaying = false;
    playBtn.querySelector("i.fas").classList.replace("fa-pause", "fa-play");
    audio.pause();
  }

  // Previous and Next
  function prevSong() {
    currentSongIndex--;
    if (currentSongIndex < 0) {
      currentSongIndex = songs.length - 1;
    }
    loadSong(songs[currentSongIndex]);
    if (isPlaying) playSong();
  }

  function nextSong() {
    currentSongIndex++;
    if (currentSongIndex > songs.length - 1) {
      currentSongIndex = 0;
    }
    loadSong(songs[currentSongIndex]);
    if (isPlaying) playSong();
  }

  // Update Progress Bar
  // filepath: /workspaces/Mediaplayer-/script.js
  function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    const progressPercent = duration ? (currentTime / duration) * 100 : 0;
    progress.style.width = `${progressPercent}%`;
    durationEl.textContent = formatTime(duration);
    currentTimeEl.textContent = formatTime(currentTime);
  }

  // Set Progress Bar on click
  function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
  }

  // Format time (e.g., 0:00)
  function formatTime(seconds) {
    const floorSeconds = Math.floor(seconds || 0);
    const minutes = Math.floor(floorSeconds / 60);
    let secs = floorSeconds % 60;
    if (secs < 10) {
      secs = `0${secs}`;
    }
    return `${minutes}:${secs}`;
  }

  // Loop functionality
  function handleLoop() {
    loopState = (loopState + 1) % 3;
    loopBtn.classList.toggle("active", loopState !== 0);
    if (loopState === 0) loopBtn.innerHTML = '<i class="fas fa-retweet"></i>'; // Off
    if (loopState === 1) loopBtn.innerHTML = '<i class="fas fa-retweet"></i>'; // All
    if (loopState === 2) loopBtn.innerHTML = "1"; // One
  }

  // Handle song end
  function handleSongEnd() {
    if (loopState === 2) {
      // Loop one
      audio.currentTime = 0;
      playSong();
    } else if (loopState === 1) {
      // Loop all
      nextSong();
    } else {
      // No loop
      if (currentSongIndex === songs.length - 1) {
        pauseSong();
      } else {
        nextSong();
      }
    }
  }

  // Playback Speed
  function changePlaybackSpeed() {
    currentSpeedIndex = (currentSpeedIndex + 1) % playbackSpeeds.length;
    const newSpeed = playbackSpeeds[currentSpeedIndex];
    audio.playbackRate = newSpeed;
    speedBtn.textContent = `${newSpeed}x`;
  }

  // --- Playlist Functions ---

  function renderPlaylist() {
    playlistEl.innerHTML = "";
    songs.forEach((song, index) => {
      const li = document.createElement("li");
      li.classList.add("playlist-item");
      li.dataset.index = index;
      li.innerHTML = `
                <img src="${song.imageSrc || DEFAULT_ALBUM_ART}" alt="${
        song.title
      }" class="playlist-item-art" onerror="this.src='${DEFAULT_ALBUM_ART}'">
                <div class="playlist-info">
                    <span class="playlist-title">${song.title}</span>
                    <span class="playlist-artist">${song.artist}</span>
                </div>
            `;
      playlistEl.appendChild(li);
    });
  }

  function updatePlaylistActiveState() {
    document.querySelectorAll(".playlist-item").forEach((item) => {
      item.classList.remove("active");
    });
    const activeItem = document.querySelector(
      `.playlist-item[data-index="${currentSongIndex}"]`
    );
    if (activeItem) {
      activeItem.classList.add("active");
    }
  }

  function handlePlaylistClick(e) {
    const targetItem = e.target.closest(".playlist-item");
    if (targetItem) {
      const index = parseInt(targetItem.dataset.index);
      if (index !== currentSongIndex) {
        currentSongIndex = index;
        loadSong(songs[currentSongIndex]);
      }
      playSong();
    }
  }

  // --- Event Listeners ---
  playBtn.addEventListener("click", () =>
    isPlaying ? pauseSong() : playSong()
  );
  prevBtn.addEventListener("click", prevSong);
  nextBtn.addEventListener("click", nextSong);
  audio.addEventListener("timeupdate", updateProgress);
  progressContainer.addEventListener("click", setProgress);
  audio.addEventListener("ended", handleSongEnd);
  loopBtn.addEventListener("click", handleLoop);
  speedBtn.addEventListener("click", changePlaybackSpeed);
  playlistEl.addEventListener("click", handlePlaylistClick);

  // Initial Load
  getSongs();
});
