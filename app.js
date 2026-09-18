// ========================================
// ドットコムゲーム広場 - app.js
// ========================================

// ゲーム一覧を読み込む
async function loadGames() {

    const { data, error } = await supabaseClient
        .from("games")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("ゲーム読み込みエラー:", error);

        document.getElementById("noResult").textContent =
            "ゲームを読み込めませんでした。";

        alert(
            "Supabaseからゲームを読み込めませんでした。\n\n" +
            "エラー:\n" +
            error.message
        );

        return;
    }

    renderGames(data || []);
}


// ========================================
// ゲーム一覧表示
// ========================================

function renderGames(games) {

    const container =
        document.getElementById("gameContainer");

    const message =
        document.getElementById("noResult");

    container.innerHTML = "";

    if (!games.length) {

        message.textContent =
            "まだゲームがありません。";

        return;
    }

    message.textContent = "";

    games.forEach(game => {

        const card =
            document.createElement("div");

        card.className = "game-card";

        const image =
            game.image ||
            "https://via.placeholder.com/260x150?text=No+Image";

        card.innerHTML = `

            <img
                src="${escapeHtml(image)}"
                onerror="this.src='https://via.placeholder.com/260x150?text=No+Image'"
            >

            <div class="game-info">

                <div class="game-title">
                    ${escapeHtml(game.name)}
                </div>

                <div class="game-desc">
                    ${escapeHtml(game.description)}
                </div>

            </div>

            <button
                class="play-button"
                onclick="playGame('${game.id}')"
            >
                ▶ プレイする
            </button>

            <button
                class="like-btn"
                onclick="likeGame('${game.id}')"
            >
                ❤️ ${game.likes || 0}
            </button>

            <button
                class="edit-btn"
                onclick="editGame('${game.id}')"
            >
                ✏️ 編集
            </button>

            <button
                class="share-btn"
                onclick="shareGame('${game.id}')"
            >
                🔗 共有
            </button>

            <button
                class="recommend-btn"
                onclick="toggleRecommend('${game.id}')"
            >
                ${game.recommended ? "★" : "☆"}
            </button>

        `;

        container.appendChild(card);

    });
}


// ========================================
// ゲーム登録
// ========================================

async function registerGame() {

    const name =
        document.getElementById("name").value.trim();

    const image =
        document.getElementById("image").value.trim();

    const description =
        document.getElementById("desc").value.trim();

    const htmlCode =
        document.getElementById("htmlCode").value;

    const cssCode =
        document.getElementById("cssCode").value;

    const jsCode =
        document.getElementById("jsCode").value;


    // 入力チェック
    if (!name) {

        alert("ゲーム名を入力してください。");
        return;

    }

    if (!description) {

        alert("ゲームの説明を入力してください。");
        return;

    }

    if (!htmlCode) {

        alert("HTMLを入力してください。");
        return;

    }


    // 編集キーを自動生成
    const editKey =
        crypto.randomUUID();


    console.log("ゲームを登録しています...");


    // Supabaseへ登録
    const { data, error } =
        await supabaseClient
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

            })
            .select();


    // 登録エラー
    if (error) {

        console.error(
            "Supabase INSERT ERROR:",
            error
        );

        alert(
            "ゲームの登録に失敗しました。\n\n" +
            "エラー内容:\n\n" +
            error.message +
            "\n\n" +
            "コード: " +
            (error.code || "不明")
        );

        return;

    }


    // 成功
    console.log(
        "ゲーム登録成功:",
        data
    );


    alert(
        "🎉 ゲームを登録しました！\n\n" +
        "編集キー:\n" +
        editKey +
        "\n\n" +
        "この編集キーはゲームの編集に必要なので、保存しておいてください。"
    );


    // 入力欄を空にする

    document.getElementById("name").value = "";

    document.getElementById("image").value = "";

    document.getElementById("desc").value = "";

    document.getElementById("htmlCode").value = "";

    document.getElementById("cssCode").value = "";

    document.getElementById("jsCode").value = "";


    // 登録フォームを閉じる

    document.getElementById(
        "registerForm"
    ).style.display = "none";


    // 一覧を更新

    loadGames();

}


// ========================================
// いいね
// ========================================

async function likeGame(id) {

    const {
        data: game,
        error: readError
    } = await supabaseClient
        .from("games")
        .select("likes")
        .eq("id", id)
        .single();


    if (readError) {

        alert(
            "いいねの読み込みに失敗しました。\n\n" +
            readError.message
        );

        return;

    }


    const newLikes =
        (game.likes || 0) + 1;


    const { error } =
        await supabaseClient
            .from("games")
            .update({
                likes: newLikes
            })
            .eq("id", id);


    if (error) {

        alert(
            "いいねに失敗しました。\n\n" +
            error.message
        );

        return;

    }


    loadGames();

}


// ========================================
// ゲームをプレイ
// ========================================

function playGame(id) {

    window.location.href =
        "game.html?id=" +
        encodeURIComponent(id);

}


// ========================================
// おすすめ切り替え
// ========================================

async function toggleRecommend(id) {

    const {
        data: game,
        error: readError
    } = await supabaseClient
        .from("games")
        .select("recommended")
        .eq("id", id)
        .single();


    if (readError) {

        alert(
            "ゲーム情報を取得できませんでした。\n\n" +
            readError.message
        );

        return;

    }


    const { error } =
        await supabaseClient
            .from("games")
            .update({

                recommended:
                    !game.recommended

            })
            .eq("id", id);


    if (error) {

        alert(
            "おすすめ設定に失敗しました。\n\n" +
            error.message
        );

        return;

    }


    loadGames();

}


// ========================================
// 共有リンク
// ========================================

async function shareGame(id) {

    const url =
        location.origin +
        location.pathname.replace(
            "index.html",
            ""
        ) +
        "game.html?id=" +
        encodeURIComponent(id);


    try {

        await navigator.clipboard.writeText(url);

        alert(
            "🔗 ゲームの共有リンクをコピーしました！"
        );

    } catch {

        prompt(
            "このリンクをコピーしてください",
            url
        );

    }

}


// ========================================
// ゲーム編集
// ========================================

async function editGame(id) {

    const key =
        prompt(
            "ゲーム登録時に表示された編集キーを入力してください。"
        );


    if (!key) {

        return;

    }


    const {
        data,
        error
    } = await supabaseClient
        .from("games")
        .select("*")
        .eq("id", id)
        .eq("edit_key", key)
        .single();


    if (error || !data) {

        alert(
            "編集キーが違うか、ゲームが存在しません。"
        );

        return;

    }


    const name =
        prompt(
            "ゲーム名",
            data.name
        );


    if (name === null) {

        return;

    }


    const description =
        prompt(
            "説明",
            data.description
        );


    if (description === null) {

        return;

    }


    const { error: updateError } =
        await supabaseClient
            .from("games")
            .update({

                name: name,

                description: description,

                updated_at:
                    new Date().toISOString()

            })
            .eq("id", id)
            .eq("edit_key", key);


    if (updateError) {

        alert(
            "編集に失敗しました。\n\n" +
            updateError.message
        );

        return;

    }


    alert(
        "✏️ 編集しました！"
    );


    loadGames();

}


// ========================================
// 検索
// ========================================

function searchGame() {

    const word =
        document
            .getElementById("searchBar")
            .value
            .toLowerCase();


    const cards =
        document.querySelectorAll(
            ".game-card"
        );


    cards.forEach(card => {

        const text =
            card.textContent.toLowerCase();


        card.style.display =
            text.includes(word)
                ? ""
                : "none";

    });

}


// ========================================
// HTMLエスケープ
// ========================================

function escapeHtml(value) {

    return String(value ?? "")

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ========================================
// 起動
// ========================================

loadGames();

