import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage, ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCohOhBpn4_za0M4X2DDsSrcrx3xYbGm8I",
    authDomain: "yours-tansein.firebaseapp.com",
    projectId: "yours-tansein",
    storageBucket: "yours-tansein.appspot.com",
    messagingSenderId: "820083472428",
    appId: "1:820083472428:web:6f00f78970c7eec1437989",
    measurementId: "G-GBTSJW4VSS"
};

// Initialize Firebase
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log("Firebase app initialized");
} else {
    app = getApps()[0];
    console.log("Using the existing Firebase app");
}


// Access Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("User is signed in");
    } else {
        console.log("No user signed in");
    }
});

// Global Variables
let currentSong = new Audio();
let songs = [];
let currFolder;

async function getSongs(folder) {
    console.log(`Fetching songs from folder: ${folder}`);
    
    currFolder = folder;
    songs = [];
    
    try {
        const listRef = ref(storage, folder);
        const res = await listAll(listRef);
        console.log(`Fetched ${res.items.length} items from folder: ${folder}`);

        res.items.forEach((itemRef) => {
            if (itemRef.name.endsWith(".mp3")) {
                let decodedName = decodeURIComponent(itemRef.name);
                songs.push(decodedName);
                console.log(`Added song: ${decodedName}`);
            }
        });

        let songUl = document.querySelector(".songList ul");
        if (songUl) {
            songUl.innerHTML = "";
            songs.forEach(song => {
                let songName = song.split(".mp3")[0];
                let temp = songName.replaceAll("%20", " ");
                songUl.innerHTML += `
                    <li>
                        <img class="invert" width="28px" src="img/music.svg" alt="">
                        <div class="info">
                            <div class="songName">${temp.split("-")[0]}</div>
                            <div class="songArtist">${temp.split("-")[1]}</div>
                        </div>
                        <div class="playNow">
                            <span>Play Now</span>
                            <img class="invert" src="img/playBtn.svg" alt="playButton" width="34px">
                        </div>
                    </li>`;
            });

            Array.from(songUl.getElementsByTagName("li")).forEach(e => {
                e.addEventListener("click", () => {
                    play.src = "img/pause.svg";
                    let songName = e.querySelector(".songName").innerHTML;
                    let songArtist = e.querySelector(".songArtist").innerHTML;
                    playSongs(`${songName}-${songArtist}.mp3`);
                });
            });
        } else {
            console.error("Song list element not found.");
        }
    } catch (error) {
        console.error("Failed to fetch songs:", error);
    }
}

const playSongs = async (track, paused = false) => {
    try {
        console.log(`Attempting to play song: ${track}`);
        
        const songRef = ref(storage, `${currFolder}/${track}`);
        const songURL = await getDownloadURL(songRef);
        console.log(`Fetched song URL: ${songURL}`);

        currentSong.src = songURL;
        if (!paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        }

        document.querySelector(".songInfo").innerHTML = track.split("-")[0].replaceAll("%20", " ");
        
        currentSong.addEventListener('loadeddata', () => {
            let duration = currentSong.duration;
            let minutes = Math.floor(parseInt(duration) / 60);
            let seconds = Math.round(duration - minutes * 60);
            document.querySelector(".songTime .totalDuration").innerHTML = `/ ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        });

        currentSong.addEventListener("timeupdate", () => {
            let currentTime = currentSong.currentTime;
            let minutes = Math.floor(parseInt(currentTime) / 60);
            let seconds = Math.round(currentTime - minutes * 60);
            document.querySelector(".songTime .currentTime").innerHTML = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            document.querySelector(".circle").style.left = `${(currentTime / currentSong.duration) * 100}%`;
        });

    } catch (error) {
        console.error("Error fetching or playing song:", error);
    }
}

async function displayAlbums() {
    console.log("1st");
    let a = await fetch("./Songs/");
    console.log(a);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let array = Array.from(anchors);
    console.log("1st");

    for (let index = 0; index < array.length; index++) {
        const e = array[index];

        if (e.href.includes("Songs")) {
            // Let's extract the folder name differently
            let folder = e.href.split('/Songs/')[1]?.split('/')[0];

            
            // Debugging step: Print out the folder value
            console.log("Extracted folder name:", folder);

            if (folder) {
                console.log("1st");
                try {
                    let metadataFetch = await fetch(`./Songs/${folder}/info.json`);
                    if (!metadataFetch.ok) {
                        throw new Error('Metadata file not found');
                    }
                    let metadataResponse = await metadataFetch.json();
                    // Continue with rendering the album card...
                } catch (error) {
                    console.error(`Failed to fetch metadata for folder ${folder}:`, error);
                    // Optionally, provide a fallback UI or skip the album
                }
                // Getting the metadata
                let metadataFetch = await fetch(`./Songs/${folder}/info.json`);
                let metadataResponse = await metadataFetch.json();

                let cardContainer = document.querySelector(".cardContainer");
                cardContainer.innerHTML += `
                    <div class="card" data-folder="${folder}">
                        <div class="playBtn">
                            <img src="img/play.svg" alt="playBtn" class="playSvg">
                        </div>
                        <img src="./Songs/${folder}/cover.jpg" alt="playlist-img">
                        <h3>${metadataResponse.title}</h3>
                        <p>${metadataResponse.description}</p>
                    </div>`;
            } else {
                console.error("Failed to extract folder name.");
            }
        }
    }
}

async function main() {
    try {
        await getSongs("Songs/ncs");
        if (songs.length > 0) {
            playSongs(songs[0], true);
        }

        displayAlbums();

        document.querySelector(".seekbar").addEventListener('click', (e) => {
            let fraction = e.offsetX / e.target.getBoundingClientRect().width;
            document.querySelector('.circle').style.left = `${(fraction) * 100}%`;
            currentSong.currentTime = currentSong.duration * fraction;
        });

        document.querySelector(".hamburger").addEventListener('click', () => {
            document.querySelector(".left").style.left = "0";
        });

        document.querySelector(".close").addEventListener('click', () => {
            document.querySelector(".left").style.left = "-200%";
        });

        previous.addEventListener('click', () => {
            let indexOfSong = songs.indexOf(currentSong.src.split(`${currFolder}/`)[1]);
            if (indexOfSong > 0) {
                playSongs(songs[indexOfSong - 1]);
            }
        });

        next.addEventListener('click', () => {
            let indexOfSong = songs.indexOf(currentSong.src.split(`${currFolder}/`)[1]);
            if (indexOfSong < songs.length - 1) {
                playSongs(songs[indexOfSong + 1]);
            }
        });

        document.querySelector(".range input").addEventListener('change', (e) => {
            currentSong.volume = parseInt(e.target.value) / 100;
        });

        // Adding event listner to card
        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener('click', (item) => {
                // console.log(item.currentTarget.dataset.folder);
                getSongs(`Songs/${item.currentTarget.dataset.folder}`)
            }
            )
        })

        document.querySelector(".volumeImg").addEventListener('click', (e) => {
            if (e.target.src.includes("volume.svg")) {
                e.target.src = e.target.src.replace("volume.svg", "mute.svg");
                volumeBar.value = 0;
                currentSong.volume = 0;
            } else {
                e.target.src = e.target.src.replace("mute.svg", "volume.svg");
                volumeBar.value = 100;
                currentSong.volume = 1;
            }
        });

        play.addEventListener('click', () => {
            if (currentSong.paused) {
                currentSong.play();
                play.src = "img/pause.svg";
            } else {
                currentSong.pause();
                play.src = "img/playBtn.svg";
            }
        });
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

main();
