async function init() {

    // local interaction
    $(document).on('click', '.image-button', event => {
        api.sendMessage('imageClicked', $(event.currentTarget).attr('data-url'));
    });

    $(document).on('click', '.sfx-button', event => {
        new Howl({
            src: [$(event.currentTarget).attr('data-url')]
        }).play();
    });

    $(document).on('keydown', event => {
        const num = parseInt(event.key);

        if (isNaN(num)) {
            return;
        }

        if (num > $('.sfx-button').length) {
            return;
        }

        new Howl({
            src: [$('.sfx-button').eq(num - 1).attr('data-url')]
        }).play();
    });

    $(document).on('click', '#play-intro', _ => {
        api.sendMessage('playVideo', 'intro');
    });

    $(document).on('click', '#play-outro', _ => {
        api.sendMessage('playVideo', 'outro');
    });

    // api events
    api.onListFiles((files) => {
        console.log(files);

        for (let i = 0; i < files.images.length; i++) {
            const image = files.images[i];
            console.log(image);

            $('#image-buttons').append($.parseHTML(`
                <div class="image-button" data-url="${image.url}">
                    <img class="image-preview" src="${image.url}">
                    <p>${image.name}</p>
                </div>
            `));
        }

        for (let i = 0; i < files.sfx.length; i++) {
            const sfx = files.sfx[i];
            console.log(sfx);

            const keymarker = i < 9 ? `(${i + 1}) ` : '';

            $('#sfx-buttons').append($.parseHTML(`
                <button class="sfx-button" data-url="${sfx.url}">
                    <img class="play-icon" src="./assets/play.png">
                    <p>${keymarker}${sfx.name}</p>
                </button>
            `));
        }
    });

    // request media files
    api.sendMessage('getFiles');
}

window.onload = _ => {
    init();
}