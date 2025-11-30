<script lang="ts">
  import { fade } from "svelte/transition";
  import { invalidateAll } from "$app/navigation";
  import { onDestroy, onMount } from "svelte";

  export let data: any;

  let audioBg: HTMLAudioElement | null = null;
  let audioTick: HTMLAudioElement | null = null;
  let audioClick: HTMLAudioElement | null = null;
  let audioReveal: HTMLAudioElement | null = null;
  let audioSuccess: HTMLAudioElement | null = null;

  function initAudio() {
    if (typeof window === "undefined") return;
    audioBg = new Audio("/sounds/bg-music.mp3");
    audioBg.loop = true;
    audioBg.volume = 0.2;

    audioTick = new Audio("/sounds/tick.mp3");
    audioTick.volume = 0.7;
    audioClick = new Audio("/sounds/click.mp3");
    audioClick.volume = 0.7;
    audioReveal = new Audio("/sounds/reveal.mp3");
    audioReveal.volume = 0.6;
    audioSuccess = new Audio("/sounds/success.mp3");
    audioReveal.volume = 0.9;
  }

  function playSound(type: "bg" | "tick" | "click" | "reveal" | "success") {
    if (typeof window === "undefined") return;

    if (!audioBg) initAudio();

    try {
      switch (type) {
        case "bg":
          audioBg?.play().catch(() => {});
          break;
        case "tick":
          if (audioTick) {
            audioTick.currentTime = 0;
            audioTick.play();
          }
          break;
        case "click":
          if (audioClick) {
            audioClick.currentTime = 0;
            audioClick.play();
          }
          break;
        case "reveal":
          audioBg?.pause();
          audioReveal?.play();
          break;
        case "success":
          audioSuccess?.play();
          break;
      }
    } catch (e) {
      console.log("Ses çalma hatası:", e);
    }
  }

  function stopBgMusic() {
    if (audioBg) {
      audioBg.pause();
      audioBg.currentTime = 0;
    }
  }

  const links = {
    instagram:
      "https://www.instagram.com/yyyazilim?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
    whatsapp: "WhatsApp Link Hidden For Safety Purposes",
  };

  const QUESTION_TIME = 30;

  let step: "intro" | "quiz" | "form" | "result" = "intro";

  $: serverWinner = data.winner;
  $: isClaimed = serverWinner?.claimed === 1;

  let prevClaimStatus = false;
  $: if (isClaimed && !prevClaimStatus) {
    playSound("success");
    prevClaimStatus = true;
  }

  let resultCode = "";
  let resultPrize = "";
  let userName = "";

  let isRestoringSession = !(data.completed && data.winner);

  if (data.completed && data.winner) {
    step = "result";
    resultCode = data.winner.code;
    resultPrize = data.winner.prize;
    userName = data.winner.name;
    prevClaimStatus = isClaimed;
  }

  let pollInterval: any;
  let quizInterval: any;
  let timeLeft = QUESTION_TIME;

  let currentQIndex = 0;
  let userAnswers: { id: number; answer: number }[] = [];
  let fixedQuestions: any[] = [];
  let isLoading = false;
  let isQuizStarting = false;

  function saveProgress(targetTime?: number) {
    if (step === "quiz" || step === "form") {
      const state = {
        step,
        currentQIndex,
        userAnswers,
        fixedQuestions,
        targetTime:
          targetTime ||
          (localStorage.getItem("quizState")
            ? JSON.parse(localStorage.getItem("quizState") || "{}").targetTime
            : Date.now() + QUESTION_TIME * 1000),
      };
      localStorage.setItem("quizState", JSON.stringify(state));
    }
  }

  function clearProgress() {
    if (typeof window !== "undefined") localStorage.removeItem("quizState");
  }

  onMount(() => {
    initAudio();

    if (data.completed && data.winner) {
      clearProgress();
      step = "result";
      isRestoringSession = false;
      return;
    }

    const savedState = localStorage.getItem("quizState");
    if (!savedState) {
      isRestoringSession = false;
      return;
    }

    try {
      const parsed = JSON.parse(savedState);

      if (parsed.step === "form") {
        step = "form";
        userAnswers = parsed.userAnswers;
        fixedQuestions = parsed.fixedQuestions;
        isRestoringSession = false;
        return;
      }

      if (parsed.step === "quiz" && parsed.fixedQuestions?.length > 0) {
        const now = Date.now();
        const remaining = Math.ceil((parsed.targetTime - now) / 1000);

        step = "quiz";
        currentQIndex = parsed.currentQIndex;
        userAnswers = parsed.userAnswers;
        fixedQuestions = parsed.fixedQuestions;

        if (remaining > 0) {
          // Sayfa yenilendiğinde tarayıcı politikası gereği müzik otomatik başlamayabilir.
          // Kullanıcı bir sayfa elemanına tıkladığında başlayabilir.
          startQuestionTimer(remaining);
        } else {
          handleTimeOut();
        }

        isRestoringSession = false;
        return;
      }
    } catch (e) {
      clearProgress();
    }
    isRestoringSession = false;
  });

  $: if (step === "result" && !isClaimed) {
    if (!pollInterval) {
      pollInterval = setInterval(() => {
        if (document.visibilityState === "visible" && step === "result") {
          invalidateAll();
        }
      }, 2000);
    }
  } else {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  function startQuestionTimer(duration = QUESTION_TIME) {
    stopQuestionTimer();
    timeLeft = duration;

    if (audioBg && audioBg.paused && step === "quiz") {
      playSound("bg");
    }

    if (duration === QUESTION_TIME) {
      const targetTime = Date.now() + QUESTION_TIME * 1000;
      saveProgress(targetTime);
    }

    quizInterval = setInterval(() => {
      timeLeft--;

      if (timeLeft <= 5 && timeLeft > 0) {
        playSound("tick");
      }

      if (timeLeft <= 0) {
        stopQuestionTimer();
        handleTimeOut();
      }
    }, 1000);
  }

  function stopQuestionTimer() {
    if (quizInterval) {
      clearInterval(quizInterval);
      quizInterval = null;
    }
  }

  function handleTimeOut() {
    selectOption(-1);
  }

  onDestroy(() => {
    if (pollInterval) clearInterval(pollInterval);
    stopQuestionTimer();
    stopBgMusic();
  });

  function startQuiz(e?: Event) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isQuizStarting || step === "quiz") return;

    playSound("bg");

    isQuizStarting = true;

    if (!data.questions || data.questions.length === 0) {
      alert("Sorular yüklenemedi, lütfen sayfayı yenileyin.");
      isQuizStarting = false;
      return;
    }

    fixedQuestions = [...data.questions];
    step = "quiz";
    currentQIndex = 0;
    userAnswers = [];

    startQuestionTimer();
    setTimeout(() => {
      isQuizStarting = false;
    }, 500);
  }

  function selectOption(optionIndex: number, e?: Event) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    playSound("click");

    const currentQ = fixedQuestions[currentQIndex];
    if (!currentQ) return;

    userAnswers.push({ id: currentQ.id, answer: optionIndex });
    stopQuestionTimer();

    if (currentQIndex < fixedQuestions.length - 1) {
      currentQIndex++;
      const nextTargetTime = Date.now() + QUESTION_TIME * 1000;
      saveProgress(nextTargetTime);
      setTimeout(() => {
        startQuestionTimer();
      }, 50);
    } else {
      step = "form";
      stopBgMusic();
      saveProgress();
    }
  }

  async function submitForm() {
    if (!userName.trim()) return alert("Adını yazmalısın!");
    if (isLoading) return;
    isLoading = true;

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        body: JSON.stringify({ name: userName, answers: userAnswers }),
      });
      const result = await res.json();

      if (result.message === "Zaten katıldınız.") {
        alert("Daha önce katılım sağlanmış.");
        clearProgress();
        window.location.reload();
        return;
      }

      if (result.success) {
        resultCode = result.code;
        resultPrize = result.prize;
        clearProgress();

        step = "result";

        playSound("reveal");

        invalidateAll();
      }
    } catch (e) {
      alert("Bağlantı hatası oluştu.");
    } finally {
      isLoading = false;
    }
  }
</script>

<div
  class="fixed inset-0 h-[100dvh] w-full bg-white text-gray-900 flex flex-col overflow-y-auto font-sans selection:bg-blue-100"
>
  <main
    class="flex-1 w-full max-w-md mx-auto flex flex-col items-center justify-center p-4 pb-6 relative"
  >
    {#if isRestoringSession}
      <div
        class="flex flex-col items-center justify-center space-y-4 animate-pulse"
      >
        <div
          class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center"
        >
          <div
            class="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"
          ></div>
        </div>
      </div>
    {:else if step === "intro"}
      <div
        in:fade
        class="flex flex-col h-full justify-evenly items-center w-full"
      >
        <div class="flex items-center justify-center gap-5 shrink">
          <div
            class="bg-white p-2 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50 w-20 h-20 md:w-24 md:h-24 flex items-center justify-center"
          >
            <img
              src="/okul-logo.png"
              alt="IESU"
              class="max-w-full max-h-full object-contain"
            />
          </div>
          <div
            class="bg-white p-2 rounded-xl border border-gray-100 shadow-lg shadow-purple-200/50 w-20 h-20 md:w-24 md:h-24 flex items-center justify-center"
          >
            <img
              src="/kulup-logo.png"
              alt="YYY"
              class="max-w-full max-h-full object-contain"
            />
          </div>
        </div>

        <div class="text-center space-y-2 shrink-0">
          <h1
            class="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight"
          >
            <span
              class="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text"
              >Yapay Zeka ve Yaratıcılık</span
            >
            <br /><span class="text-gray-900">Kulübü</span>
          </h1>
          <div
            class="bg-orange-50 border border-orange-100 px-4 py-2 rounded-lg inline-block mt-1"
          >
            <p class="text-orange-800 font-bold text-xs md:text-sm">
              Tavuklu Pilav Bizden,<br />Büyük Ödül Senden!
            </p>
          </div>
        </div>

        <div
          class="w-full max-w-xs mx-auto bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center shadow-sm shrink-0"
        >
          <p
            class="text-xs font-bold text-gray-700 mb-3 flex items-center justify-center gap-2"
          >
            <span
              class="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full"
              >ZORUNLU</span
            > Önce Takip Et!
          </p>
          <div class="flex justify-center gap-4">
            <a
              href={links.instagram}
              target="_blank"
              class="flex flex-col items-center gap-1 group"
            >
              <div
                class="w-14 h-14 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-full p-[2px] shadow-md group-hover:scale-110 transition"
              >
                <div
                  class="bg-white w-full h-full rounded-full flex items-center justify-center"
                >
                  <svg
                    class="w-7 h-7 text-purple-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                    /></svg
                  >
                </div>
              </div>
              <span class="text-xs font-medium text-gray-500">Takip Et</span>
            </a>

            <a
              href={links.whatsapp}
              target="_blank"
              class="flex flex-col items-center gap-1 group"
            >
              <div
                class="w-14 h-14 bg-green-500 rounded-full p-[2px] shadow-md group-hover:scale-110 transition flex items-center justify-center"
              >
                <svg
                  class="w-7 h-7 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  ><path
                    d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"
                  /></svg
                >
              </div>
              <span class="text-xs font-medium text-gray-500">Gruba Gir</span>
            </a>
          </div>
        </div>

        <div class="w-full max-w-xs mx-auto shrink-0">
          <button
            type="button"
            on:click={startQuiz}
            class="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-2xl shadow-gray-400/50 transition transform active:scale-95 flex items-center justify-center gap-3"
          >
            <span>TAKİP ETTİM, BAŞLA</span>
          </button>
        </div>
      </div>
    {:else if step === "quiz"}
      <div
        in:fade
        class="w-full max-w-md text-center flex flex-col justify-center h-full"
      >
        <div
          class="w-full bg-gray-100 h-3 rounded-full mb-6 overflow-hidden border border-gray-200 relative"
        >
          <div
            class="h-full bg-blue-500 transition-all duration-1000 ease-linear"
            style="width: {(timeLeft / QUESTION_TIME) * 100}%"
          ></div>
        </div>

        <div class="flex justify-between items-center mb-6 px-1">
          <span class="text-gray-400 text-sm font-bold tracking-wider"
            >SORU {currentQIndex + 1} / {fixedQuestions.length}</span
          >
          <div
            class="flex items-center gap-1 text-gray-800 font-bold font-mono bg-gray-100 px-2 py-1 rounded-lg text-sm border border-gray-200"
          >
            {#if timeLeft <= 5}
              <span class="animate-ping text-red-500">🔴</span>
            {:else}
              <span>⏱</span>
            {/if}
            <span class:text-red-600={timeLeft <= 5}>{timeLeft}sn</span>
          </div>
        </div>

        <h2
          class="text-xl font-bold mb-8 min-h-[80px] flex items-center justify-center flex-col leading-snug"
        >
          {@html fixedQuestions[currentQIndex].text}
        </h2>

        <div class="space-y-3">
          {#each fixedQuestions[currentQIndex].options as opt, i}
            <button
              type="button"
              on:click={(e) => selectOption(i, e)}
              class="w-full p-4 text-left bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 active:bg-blue-600 active:text-white active:border-blue-600 transition font-medium text-gray-700 shadow-sm"
            >
              {opt}
            </button>
          {/each}
        </div>
      </div>
    {:else if step === "form"}
      <div in:fade class="w-full max-w-xs text-center space-y-6">
        <h2 class="text-2xl font-bold">Sonuçlar Hazır!</h2>
        <p class="text-gray-500">Ödül kodunu oluşturmak için adını yaz.</p>
        <input
          bind:value={userName}
          type="text"
          placeholder="Adın Soyadın"
          class="w-full p-4 text-center text-lg border-2 border-gray-300 rounded-xl focus:border-black focus:outline-none transition"
        />
        <button
          type="button"
          on:click={submitForm}
          disabled={isLoading}
          class="w-full bg-black text-white py-4 rounded-xl font-bold text-lg shadow-xl active:scale-95 transition disabled:opacity-50"
        >
          {isLoading ? "Oluşturuluyor..." : "KODU GÖSTER"}
        </button>
      </div>
    {:else if step === "result"}
      <div
        in:fade
        class="w-full max-w-md text-center bg-white border-2 border-gray-100 rounded-3xl p-8 shadow-2xl"
      >
        {#if userName}
          <p class="text-gray-400 text-sm mb-2 uppercase tracking-widest">
            {userName}
          </p>
        {/if}

        {#if isClaimed}
          <div class="flex flex-col items-center justify-center py-6 space-y-4">
            <div
              class="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-6xl shadow-inner animate-bounce"
            >
              ✓
            </div>
            <h2 class="text-3xl font-extrabold text-green-600">
              Afiyet Olsun!
            </h2>
            <p class="text-gray-500">Ödülünü teslim aldın.</p>
            <div
              class="mt-4 bg-gray-100 px-4 py-2 rounded text-gray-400 line-through font-mono"
            >
              {resultCode}
            </div>
          </div>
        {:else}
          {#if resultPrize === "BIG"}
            <div class="text-6xl mb-2">🏆</div>
            <h2 class="text-2xl font-bold text-yellow-500 mb-2">TEBRİKLER!</h2>
            <p class="text-gray-500">Tüm soruları doğru bildin!</p>
          {:else if resultPrize === "SMALL"}
            <div class="text-6xl mb-2">🎁</div>
            <h2 class="text-2xl font-bold text-blue-500 mb-2">GAYET İYİ!</h2>
            <p class="text-gray-500">Güzel bir skor yaptın.</p>
          {:else}
            <div class="text-6xl mb-2">🍀</div>
            <h2 class="text-2xl font-bold text-gray-400 mb-2">SAĞLIK OLSUN</h2>
            <p class="text-gray-500">Yine de kodunu göster!</p>
          {/if}

          <div
            class="my-8 bg-gray-900 text-white rounded-2xl p-6 relative overflow-hidden group"
          >
            <p class="text-xs text-gray-400 uppercase tracking-widest mb-2">
              Doğrulama Kodu
            </p>
            <p class="text-4xl font-mono font-bold tracking-widest">
              {resultCode}
            </p>
            <div
              class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            ></div>
          </div>

          <p class="text-red-500 text-xs font-bold animate-pulse">
            ⚠️ BU EKRANI KAPATMA, GÖREVLİYE GÖSTER!
          </p>
        {/if}
      </div>
    {/if}

    <footer
      class="text-gray-400 text-[10px] text-center w-full shrink-0 mt-auto"
    >
      IESU | Yapay Zeka ve Yaratıcılık Kulübü &copy; 2025
    </footer>
  </main>
</div>
