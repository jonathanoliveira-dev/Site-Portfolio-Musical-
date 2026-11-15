const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Abrir menu" : "Fechar menu");
  siteNav.classList.toggle("is-open", !isExpanded);
});

siteNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
    siteNav.classList.remove("is-open");
  });
});

document.querySelector("#current-year").textContent = new Date().getFullYear();

// Add each new MP3 to `beats/` and copy an entry here to publish it.
const beatCatalog = [
  // { title: "Nome do beat", style: "Funk", bpm: 130, preview: "beats/nome-do-beat.mp3" },
];
const beatsList = document.querySelector("#beats-list");
const beatsEmpty = document.querySelector("#beats-empty");
const beatAudio = document.querySelector("#beat-audio");
const beatRows = [];
let activeBeatIndex = -1;

function updateBeatButton(index, isPlaying) {
  const row = beatRows[index];
  if (!row) {
    return;
  }

  row.playButton.setAttribute(
    "aria-label",
    `${isPlaying ? "Pausar" : "Reproduzir"} prévia de ${row.beat.title}`,
  );
  row.playButton.setAttribute("aria-pressed", String(isPlaying));
  row.playButton.querySelector("span").textContent = isPlaying ? "Ⅱ" : "▶";
}

function updateBeatProgress() {
  const row = beatRows[activeBeatIndex];
  if (!row || !Number.isFinite(beatAudio.duration) || beatAudio.duration <= 0) {
    return;
  }

  row.progress.value = beatAudio.currentTime / beatAudio.duration;
}

function renderBeatCatalog() {
  beatsEmpty.hidden = beatCatalog.length > 0;

  beatCatalog.forEach((beat, index) => {
    const row = document.createElement("li");
    row.className = "beat-row";

    const playButton = document.createElement("button");
    playButton.className = "beat-play";
    playButton.type = "button";
    playButton.setAttribute("aria-label", `Reproduzir prévia de ${beat.title}`);
    playButton.setAttribute("aria-pressed", "false");
    playButton.innerHTML = "<span aria-hidden=\"true\">▶</span>";

    const details = document.createElement("div");
    details.className = "beat-details";

    const title = document.createElement("strong");
    title.textContent = beat.title;

    const metadata = document.createElement("span");
    metadata.textContent = [beat.style, beat.bpm ? `${beat.bpm} BPM` : ""]
      .filter(Boolean)
      .join(" · ");

    const progress = document.createElement("progress");
    progress.className = "beat-progress";
    progress.max = 1;
    progress.value = 0;
    progress.setAttribute("aria-label", `Progresso da prévia de ${beat.title}`);

    const status = document.createElement("span");
    status.className = "beat-status";
    status.setAttribute("aria-live", "polite");

    details.append(title, metadata, progress, status);

    const purchaseLink = document.createElement("a");
    purchaseLink.className = "beat-license";
    purchaseLink.href = `mailto:jowjonyacessoria@hotmail.com?subject=${encodeURIComponent(
      `Interesse no beat "${beat.title}"`,
    )}&body=${encodeURIComponent(
      `Olá! Tenho interesse no beat "${beat.title}". Pode me enviar as opções de licença e valores?`,
    )}`;
    purchaseLink.textContent = "CONSULTAR LICENÇA ↗";

    row.append(playButton, details, purchaseLink);
    beatsList.append(row);
    beatRows.push({ beat, playButton, progress, status });

    playButton.addEventListener("click", () => {
      if (activeBeatIndex === index && !beatAudio.paused) {
        beatAudio.pause();
        return;
      }

      beatRows.forEach((beatRow, rowIndex) => {
        updateBeatButton(rowIndex, false);
        beatRow.status.textContent = "";
      });

      activeBeatIndex = index;
      const currentBeat = beatRows[index];
      currentBeat.status.textContent = "Carregando prévia…";
      if (beatAudio.dataset.preview !== beat.preview) {
        beatAudio.pause();
        beatAudio.dataset.preview = beat.preview;
        beatAudio.src = beat.preview;
        beatAudio.load();
      }

      beatAudio.play().catch(() => {
        if (activeBeatIndex === index) {
          currentBeat.status.textContent = "Não foi possível reproduzir esta prévia.";
          updateBeatButton(index, false);
        }
      });
    });
  });
}

renderBeatCatalog();

beatAudio.addEventListener("playing", () => {
  if (activeBeatIndex < 0) {
    return;
  }

  beatRows[activeBeatIndex].status.textContent = "";
  updateBeatButton(activeBeatIndex, true);
});

beatAudio.addEventListener("pause", () => {
  if (activeBeatIndex >= 0) {
    updateBeatButton(activeBeatIndex, false);
  }
});

beatAudio.addEventListener("timeupdate", updateBeatProgress);
beatAudio.addEventListener("loadedmetadata", updateBeatProgress);
beatAudio.addEventListener("ended", () => {
  if (activeBeatIndex >= 0) {
    const row = beatRows[activeBeatIndex];
    row.progress.value = 0;
    updateBeatButton(activeBeatIndex, false);
    beatAudio.currentTime = 0;
  }
});
beatAudio.addEventListener("error", () => {
  if (activeBeatIndex >= 0) {
    const row = beatRows[activeBeatIndex];
    row.status.textContent = "Prévia indisponível. Tente novamente mais tarde.";
    updateBeatButton(activeBeatIndex, false);
  }
});

const heroVideo = document.querySelector(".hero-art");
const heroSection = document.querySelector(".hero");
const heroVideoCaption = document.querySelector("#hero-video-caption");
const heroVideoStatus = document.querySelector("#hero-video-status");
const heroVideoOpen = document.querySelector("#hero-video-open");
const heroVideoPlay = document.querySelector("#hero-video-play");
const heroVideoSound = document.querySelector("#hero-video-sound");
const uploadsPlaylistId = "UU4J-oEbHa3j5j54GVUovUPA";
const previewDuration = 12000;

let heroPlayer;
let heroPlayerReady = false;
let heroPlayerError = false;
let playlistLoaded = false;
let playbackErrorCount = 0;
let playerLoadTimeout;
let previewTimer;

function setPlayerError(message) {
  heroPlayerError = true;
  window.clearTimeout(playerLoadTimeout);
  window.clearTimeout(previewTimer);
  heroVideo.classList.remove("is-video-ready");
  heroVideoStatus.textContent = message;
  heroVideoStatus.classList.add("is-visible");
}

function startUploadsPlaylist(player) {
  heroVideoStatus.classList.remove("is-visible");
  heroVideoStatus.textContent = "CARREGANDO PRÉVIAS DO CANAL…";

  if (!playlistLoaded) {
    playlistLoaded = true;
    player.loadPlaylist({
      list: uploadsPlaylistId,
      listType: "playlist",
      index: 0,
      startSeconds: 0,
      suggestedQuality: "small",
    });
    player.setLoop(true);
    return;
  }

  player.playVideo();
}

heroVideoPlay.addEventListener("click", () => {
  if (!heroPlayerReady) {
    heroVideoStatus.textContent = "Carregando vídeo · tente novamente em instantes";
    return;
  }

  if (heroPlayer.getPlayerState() === window.YT.PlayerState.PLAYING) {
    heroPlayer.pauseVideo();
    heroVideoPlay.setAttribute("aria-label", "Reproduzir vídeo de fundo");
    heroVideoPlay.setAttribute("aria-pressed", "true");
    heroVideoPlay.querySelector("span").textContent = "▶";
    heroVideoStatus.textContent = "VÍDEO PAUSADO";
  } else {
    startUploadsPlaylist(heroPlayer);
    heroVideoPlay.setAttribute("aria-label", "Pausar vídeo de fundo");
    heroVideoPlay.setAttribute("aria-pressed", "false");
    heroVideoPlay.querySelector("span").textContent = "Ⅱ";
  }
});

heroVideoSound.addEventListener("click", () => {
  if (!heroPlayerReady) {
    heroVideoStatus.textContent = "Carregando vídeo · tente novamente em instantes";
    return;
  }

  const soundIsOn = !heroPlayer.isMuted();
  if (soundIsOn) {
    heroPlayer.mute();
    heroVideoSound.setAttribute("aria-label", "Ativar som do vídeo de fundo");
    heroVideoSound.setAttribute("aria-pressed", "false");
    heroVideoStatus.textContent = "VÍDEO DE FUNDO · SEM SOM";
  } else {
    heroPlayer.unMute();
    heroPlayer.setVolume(80);
    heroVideoSound.setAttribute("aria-label", "Silenciar vídeo de fundo");
    heroVideoSound.setAttribute("aria-pressed", "true");
    heroVideoStatus.textContent = "VÍDEO DE FUNDO · COM SOM";
  }
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (heroVideo && prefersReducedMotion) {
  heroVideoStatus.textContent = "Animação reduzida · use os controles para iniciar o vídeo";
}

if (heroVideo) {
  window.onYouTubeIframeAPIReady = () => {
    const playerVars = {
      autoplay: prefersReducedMotion ? 0 : 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      mute: 1,
      playsinline: 1,
      rel: 0,
      loop: 1,
    };

    if (window.location.protocol !== "file:") {
      playerVars.origin = window.location.origin;
    }

    heroPlayer = new window.YT.Player("hero-video-player", {
      playerVars,
      events: {
        onReady: (event) => {
          window.clearTimeout(playerLoadTimeout);
          heroPlayerReady = true;
          event.target.mute();
          heroVideoStatus.classList.remove("is-visible");
          if (prefersReducedMotion) {
            heroVideoPlay.setAttribute("aria-label", "Reproduzir vídeo de fundo");
            heroVideoPlay.setAttribute("aria-pressed", "true");
            heroVideoPlay.querySelector("span").textContent = "▶";
            heroVideoStatus.textContent = "Animação reduzida · use os controles para iniciar o vídeo";
          } else {
            startUploadsPlaylist(event.target);
            heroVideoStatus.textContent = "PRÉVIAS AUTOMÁTICAS DO CANAL · SEM SOM";
          }
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            playbackErrorCount = 0;
            heroVideoPlay.setAttribute("aria-label", "Pausar vídeo de fundo");
            heroVideoPlay.setAttribute("aria-pressed", "false");
            heroVideoPlay.querySelector("span").textContent = "Ⅱ";
            const video = event.target.getVideoData();
            if (video.video_id) {
              heroVideoCaption.textContent = video.title
                ? `PRÉVIA · ${video.title}`
                : "PRÉVIA AUTOMÁTICA · CANAL JOW JONY";
              heroVideoOpen.href = `https://www.youtube.com/watch?v=${encodeURIComponent(video.video_id)}`;
            }
            heroVideoStatus.textContent = heroPlayer.isMuted()
              ? "PRÉVIAS AUTOMÁTICAS DO CANAL · SEM SOM"
              : "PRÉVIAS AUTOMÁTICAS DO CANAL · COM SOM";
            heroVideoStatus.classList.remove("is-visible");
            heroVideo.classList.add("is-video-ready");
            window.clearTimeout(previewTimer);
            previewTimer = window.setTimeout(() => {
              if (heroPlayer.getPlayerState() === window.YT.PlayerState.PLAYING) {
                heroPlayer.nextVideo();
              }
            }, previewDuration);
          } else if (event.data === window.YT.PlayerState.ENDED) {
            window.clearTimeout(previewTimer);
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            window.clearTimeout(previewTimer);
            heroVideoPlay.setAttribute("aria-label", "Reproduzir vídeo de fundo");
            heroVideoPlay.setAttribute("aria-pressed", "true");
            heroVideoPlay.querySelector("span").textContent = "▶";
            heroVideoStatus.textContent = "VÍDEO PAUSADO";
          } else if (event.data === window.YT.PlayerState.BUFFERING || event.data === window.YT.PlayerState.CUED) {
            window.clearTimeout(previewTimer);
          }
        },
        onError: (event) => {
          window.clearTimeout(previewTimer);
          playbackErrorCount += 1;
          if (playlistLoaded && playbackErrorCount < 5) {
            heroVideoStatus.textContent = "Pulando um vídeo que não pode ser incorporado…";
            window.setTimeout(() => heroPlayer.nextVideo(), 1200);
            return;
          }
          setPlayerError("Prévia indisponível · confira o canal completo no YouTube");
        },
        onAutoplayBlocked: () => {
          heroVideoStatus.textContent = "Toque em reproduzir para iniciar o vídeo";
          heroVideoStatus.classList.add("is-visible");
          heroVideoPlay.setAttribute("aria-label", "Reproduzir vídeo de fundo");
          heroVideoPlay.setAttribute("aria-pressed", "true");
          heroVideoPlay.querySelector("span").textContent = "▶";
        },
      },
    });
  };

  playerLoadTimeout = window.setTimeout(() => {
    if (!heroPlayerReady) {
      setPlayerError("Prévia indisponível · use o link para assistir no YouTube");
    }
  }, 12000);

  const youtubeApi = document.createElement("script");
  youtubeApi.src = "https://www.youtube.com/iframe_api";
  youtubeApi.async = true;
  youtubeApi.onerror = () => {
    setPlayerError("Não foi possível carregar a prévia · abra o clipe no YouTube");
  };
  document.head.append(youtubeApi);
}

heroSection?.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const bounds = heroSection.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - 0.5;
  const y = (event.clientY - bounds.top) / bounds.height - 0.5;
  heroVideo.style.setProperty("--pointer-x", `${Math.round(x * -12)}px`);
  heroVideo.style.setProperty("--pointer-y", `${Math.round(y * -12)}px`);
});

heroSection?.addEventListener("pointerleave", () => {
  heroVideo.style.setProperty("--pointer-x", "0px");
  heroVideo.style.setProperty("--pointer-y", "0px");
});
