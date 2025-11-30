<script lang="ts">
  import { enhance } from "$app/forms";
  import { onMount } from "svelte";
  import { invalidateAll } from "$app/navigation";

  export let data: any;
  export let form: any;

  function formatTime(dateStr: string) {
    if (!dateStr) return "--.--.---- --:--";
    // UTC'den TR saatine tam tarih çevirimi
    const date = new Date(dateStr.replace(" ", "T") + "Z");

    // Örnek çıktı: 22.11.2025 14:30
    return date.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  onMount(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        invalidateAll();
      }
    }, 3000);

    return () => clearInterval(interval);
  });
</script>

<div class="min-h-screen bg-slate-100 font-sans text-slate-900 p-4 pb-20">
  {#if !data.authorized}
    <div class="flex flex-col items-center justify-center h-[80vh] space-y-6">
      <div
        class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border border-slate-200"
      >
        <div
          class="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
        >
          🛡️
        </div>
        <h1 class="text-2xl font-bold mb-2">Yetkili Girişi</h1>
        <p class="text-slate-500 text-sm mb-6">Yazılım ve Yapay Zeka Kulübü</p>

        <form method="POST" action="?/login" class="space-y-4">
          <input
            type="password"
            name="password"
            placeholder="Admin Şifresi"
            class="w-full p-4 border-2 border-slate-200 rounded-xl text-center text-lg focus:border-blue-500 focus:outline-none transition"
          />

          <button
            class="w-full bg-slate-900 hover:bg-black text-white p-4 rounded-xl font-bold shadow-lg active:scale-95 transition"
            >GİRİŞ YAP</button
          >

          {#if form?.incorrect}
            <div
              class="bg-red-100 text-red-600 p-3 rounded-lg text-sm font-bold animate-pulse"
            >
              Hatalı şifre! (Lütfen bekleyip tekrar dene)
            </div>
          {/if}
        </form>
      </div>
    </div>
  {:else}
    <header
      class="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200"
    >
      <div>
        <h1 class="text-lg font-extrabold text-slate-800">YARIŞMA PANELİ</h1>
        <p class="text-xs text-slate-500">Anlık Takip Sistemi</p>
      </div>
      <form method="POST" action="?/logout">
        <button
          class="text-xs bg-slate-100 hover:bg-red-100 hover:text-red-600 px-4 py-2 rounded-lg font-bold transition"
          >ÇIKIŞ</button
        >
      </form>
    </header>

    <div class="grid grid-cols-3 gap-3 mb-6">
      <div
        class="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 text-center"
      >
        <div
          class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
        >
          Dağıtılan Büyük
        </div>
        <div class="text-2xl font-black text-yellow-500 mt-1">
          {data.stats.big}
        </div>
      </div>
      <div
        class="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 text-center"
      >
        <div
          class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
        >
          Dağıtılan Küçük
        </div>
        <div class="text-2xl font-black text-blue-500 mt-1">
          {data.stats.small}
        </div>
      </div>
      <div
        class="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 text-center"
      >
        <div
          class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
        >
          Toplam Katılım
        </div>
        <div class="text-2xl font-black text-slate-700 mt-1">
          {data.stats.total}
        </div>
      </div>
    </div>

    <form class="flex gap-2 mb-8" method="GET">
      <div class="relative flex-1">
        <input
          type="text"
          name="q"
          value={data.query || ""}
          placeholder="Kod Girin (Örn: AV42...)"
          class="w-full p-4 pl-4 rounded-2xl border-2 border-blue-500 text-lg uppercase font-mono shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20"
          autocomplete="off"
        />
      </div>
      <button
        class="bg-blue-600 text-white px-6 rounded-2xl font-bold shadow-lg active:scale-95 transition"
        >ARA</button
      >
    </form>

    {#if data.searchResult}
      <div
        class="mb-8 bg-white border-2 {data.searchResult.claimed
          ? 'border-red-100'
          : 'border-green-100'} rounded-2xl shadow-xl overflow-hidden"
      >
        <div
          class="p-6 {data.searchResult.claimed ? 'bg-red-50' : 'bg-green-50'}"
        >
          <div class="flex justify-between items-start">
            <div>
              <p class="text-xs font-bold text-slate-400 uppercase mb-1">
                Yarışmacı
              </p>
              <h2 class="text-2xl font-bold text-slate-800">
                {data.searchResult.name}
              </h2>
              <div
                class="font-mono text-lg text-slate-500 mt-1 bg-white/60 inline-block px-2 rounded border border-slate-200/50"
              >
                {data.searchResult.code}
              </div>
            </div>

            <div class="text-right">
              {#if data.searchResult.prize === "BIG"}
                <div
                  class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg font-bold text-xs border border-yellow-200 inline-block mb-1"
                >
                  🏆 BÜYÜK ÖDÜL
                </div>
              {:else if data.searchResult.prize === "SMALL"}
                <div
                  class="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-bold text-xs border border-blue-200 inline-block mb-1"
                >
                  🎁 KÜÇÜK ÖDÜL
                </div>
              {:else}
                <div
                  class="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg font-bold text-xs border border-gray-200 inline-block mb-1"
                >
                  🍗 SADECE PİLAV
                </div>
              {/if}
              <div class="text-xs text-slate-400 font-bold mt-1">
                Skor: {data.searchResult.score} / 8
              </div>

              <div
                class="text-[10px] text-slate-500 font-mono mt-1 bg-white/50 px-1 rounded inline-block"
              >
                📅 {formatTime(data.searchResult.created_at)}
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-white">
          {#if data.searchResult.claimed}
            <div
              class="w-full bg-red-100 text-red-600 font-bold py-4 rounded-xl flex items-center justify-center gap-2 border border-red-200 opacity-75"
            >
              <span>❌ TESLİM EDİLMİŞ</span>
            </div>
          {:else}
            <form method="POST" action="?/claim" use:enhance>
              <input type="hidden" name="code" value={data.searchResult.code} />
              <button
                class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-5 rounded-xl shadow-lg shadow-green-600/30 active:scale-95 transition text-xl flex items-center justify-center gap-2"
              >
                <span>✅ TESLİM ET</span>
              </button>
            </form>
            <p class="text-center text-xs text-slate-400 mt-3">
              Butona basınca öğrenci ekranı yeşile döner.
            </p>
          {/if}
        </div>
      </div>
    {:else if data.query}
      <div
        class="p-6 bg-red-50 border-2 border-red-100 text-red-800 rounded-2xl text-center mb-8 shadow-sm"
      >
        <div class="text-4xl mb-2">🤔</div>
        <h3 class="font-bold text-lg">Kod Bulunamadı</h3>
        <p class="text-sm opacity-80">Lütfen kodu doğru yazdığından emin ol.</p>
      </div>
    {/if}

    <h3
      class="font-bold text-slate-400 mb-4 text-xs uppercase tracking-widest ml-1"
    >
      Son Aktiviteler
    </h3>
    <div class="space-y-3">
      {#each data.recentWinners as winner}
        <div
          class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center {winner.claimed
            ? 'opacity-50 grayscale-[50%]'
            : ''}"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                            {winner.prize === 'BIG'
                ? 'bg-yellow-100 text-yellow-700'
                : winner.prize === 'SMALL'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-500'}"
            >
              {winner.prize === "BIG"
                ? "🏆"
                : winner.prize === "SMALL"
                  ? "🎁"
                  : "🍗"}
            </div>
            <div>
              <p class="font-bold text-slate-800 text-sm">{winner.name}</p>
              <p class="text-[10px] font-mono text-slate-400">{winner.code}</p>
            </div>
          </div>

          <div class="flex flex-col items-end gap-1">
            {#if winner.claimed}
              <span
                class="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded"
                >VERİLDİ</span
              >
            {:else}
              <span
                class="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded"
                >BEKLİYOR</span
              >
            {/if}
            <span class="text-[10px] text-slate-400 font-mono">
              {formatTime(winner.created_at)}
            </span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
