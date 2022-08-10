async function init() {
    let $sfxDirectory = $('#sfx-directory');

    $sfxDirectory.change((e) => {
        console.log(e);
        let $sfxButtons = $('#sfx-button-container');
    });

    console.log($sfxDirectory);
}

$(document).ready(() => {
    init();
});