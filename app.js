async function loadGames() {
    const { data, error } = await supabaseClient
        .from("games")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        document.getElementById("noResult").textContent =
            "ゲームの読み込みに失敗しました。";
        return;
    }

    renderGames(data || []);
}

function renderGames(games) {
    const container = document.getElementById("gameContainer");
    const message = document.getElementById("noResult");

    container.innerHTML = "";

    if (!games.length) {
        message.textContent = "まだゲームがありません。";
        return;
    }

    message.textContent = "";

    games.forEach(game => {
        const card = document.createElement("div");
        card.className = "game-card";

        const image =
            game.image ||
            "https://via.placeholder.com/260x150?text=No+Image";

        card.innerHTML = `
            <img src="${escapeHtml(image)}"
                 onerror="this.src='https://via.placeholder.com/260x150?text=No+Image'">

            <div class="game-info">
                <div class="game-title">
                    ${escapeHtml(game.name)}
                </div>

                <div class="game-desc">
                    ${escapeHtml(game.description)}
                </div>
            </div>

            <button class="play-button"
                    onclick="playGame('${game.id}')">
                ▶ プレイする
            </button>

            <button class="like-btn"
                    onclick="likeGame('${game.id}')">
                ❤️ ${game.likes || 0}
            </button>

            <button class="edit-btn"
                    onclick="editGame('${game.id}')">
                ✏️ 編集
            </button>

            <button class="share-btn"
                    onclick="shareGame('${game.id}')">
                🔗 共有
            </button>

            <button class="recommend-btn"
                    onclick="toggleRecommend('${game.id}')">
                ${game.recommended ? "★" : "☆"}
            </button>
        `;

        container.appendChild(card);
    });
}

async function registerGame() {
    const name = document.getElementById("name").value.trim();
    const image = document.getElementById("image").value.trim();
    const description = document.getElementById("desc").value.trim();

    const htmlCode = document.getElementById("htmlCode").value;
    const cssCode = document.getElementById("cssCode").value;
    const jsCode = document.getElementById("jsCode").value;

    if (!name || !description) {
        alert("ゲーム名と説明を入力してください。");
        return;
    }

    const editKey =
        crypto.randomUUID();

    const { error } = await supabaseClient
        .from("games")
        .insert({
            name: name,
            image: image,
            description: description,
            html_code: htmlCode,
            css_code: cssCode,
            js_code: jsCode,
            likes: 0,
            recommended: false,
            edit_key: editKey
        });

    if (error) {
        console.error(error);
        alert("ゲームの登録に失敗しました。");
        return;
    }

    alert(
        "ゲームを登録しました！\n\n" +
        "編集キーは大切に保管してください。\n" +
        editKey
    );

    document.getElementById("name").value = "";
    document.getElementById("image").value = "";
    document.getElementById("desc").value = "";
    document.getElementById("htmlCode").value = "";
    document.getElementById("cssCode").value = "";
    document.getElementById("jsCode").value = "";

    document.getElementById("registerForm").style.display = "none";

    loadGames();
}

async function likeGame(id) {
    const { data: game, error: readError } =
        await supabaseClient
            .from("games")
            .select("likes")
            .eq("id", id)
            .single();

    if (readError) {
        alert("いいねに失敗しました。");
        return;
    }

    const { error } =
        await supabaseClient
            .from("games")
            .update({
                likes: (game.likes || 0) + 1
            })
            .eq("id", id);

    if (error) {
        alert("いいねに失敗しました。");
        return;
    }

    loadGames();
}

function playGame(id) {
    window.location.href =
        "game.html?id=" + encodeURIComponent(id);
}

async function toggleRecommend(id) {
    const { data: game, error: readError } =
        await supabaseClient
            .from("games")
            .select("recommended")
            .eq("id", id)
            .single();

    if (readError) return;

    const { error } =
        await supabaseClient
            .from("games")
            .update({
                recommended: !game.recommended
            })
            .eq("id", id);

    if (error) {
        alert("おすすめ設定に失敗しました。");
        return;
    }

    loadGames();
}

async function shareGame(id) {
    const url =
        location.origin +
        location.pathname.replace("index.html", "") +
        "game.html?id=" +
        encodeURIComponent(id);

    try {
        await navigator.clipboard.writeText(url);
        alert("ゲームの共有リンクをコピーしました！");
    } catch {
        prompt("このリンクをコピーしてください", url);
    }
}

async function editGame(id) {
    const key = prompt(
        "このゲームを登録したときの編集キーを入力してください。"
    );

    if (!key) return;

    const { data, error } =
        await supabaseClient
            .from("games")
            .select("*")
            .eq("id", id)
            .eq("edit_key", key)
            .single();

    if (error || !data) {
        alert("編集キーが違います。");
        return;
    }

    const name =
        prompt("ゲーム名", data.name);

    if (name === null) return;

    const description =
        prompt("説明", data.description);

    if (description === null) return;

    const { error: updateError } =
        await supabaseClient
            .from("games")
            .update({
                name: name,
                description: description,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .eq("edit_key", key);

    if (updateError) {
        alert("編集に失敗しました。");
        return;
    }

    alert("編集しました！");
    loadGames();
}

function searchGame() {
    const word =
        document.getElementById("searchBar")
        .value
        .toLowerCase();

    const cards =
        document.querySelectorAll(".game-card");

    cards.forEach(card => {
        card.style.display =
            card.textContent
                .toLowerCase()
                .includes(word)
                ? ""
                : "none";
    });
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

loadGames();
