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

// Check if Firebase app is already initialized
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized");
} else {
  app = getApps()[0]; // Use the already initialized app
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
        console.log("hi");
    }
});


// Global Variables
let currentSong = new Audio();
let songs = [];
let currFolder;
document.querySelector(".range").getElementsByTagName("input")[0].value = 100;

async function getSongs(folder) {
    console.log(`Fetching songs from folder: ${folder}`);
    
    currFolder = folder;
    songs = [];
    
    try {
        // Fetch songs from Firebase Storage
        const listRef = ref(storage, folder);
        const res = await listAll(listRef);
        console.log(`Fetched ${res.items.length} items from folder: ${folder}`);

        // Add songs to the array
        res.items.forEach((itemRef) => {
            if (itemRef.name.endsWith(".mp3")) {
                // Decode the song name for better display
                let decodedName = decodeURIComponent(itemRef.name);
                songs.push(decodedName);
                console.log(`Added song: ${decodedName}`);
            }
        });

        // Update UI with songs
        let songUl = document.querySelector(".songList").getElementsByTagName("ul")[0];
        songUl.innerHTML = "";
        songs.forEach(song => {
            let songName = song.split(".mp3")[0];
            let temp = songName.replaceAll("%20", " "); // Make sure spaces are decoded
        
            // Update the song list in the UI
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

        // Add click events to play songs
        Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
            e.addEventListener("click", () => {
                play.src = "img/pause.svg";
                let songName = e.querySelector(".songName").innerHTML;
                let songArtist = e.querySelector(".songArtist").innerHTML;
                playSongs(`${songName}-${songArtist}.mp3`);
            });
        });
    } catch (error) {
        console.error("Failed to fetch songs:", error);
    }
}

const playSongs = async (track, paused = false) => {
    try {
        console.log(`Attempting to play song: ${track}`);
        
        // Get the song URL from Firebase Storage
        const songRef = ref(storage, `${currFolder}/${track}`);
        const songURL = await getDownloadURL(songRef);
        console.log(`Fetched song URL: ${songURL}`);

        // Play the song
        currentSong.src = songURL;
        if (!paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        }

        // Update song info
        document.querySelector(".songInfo").innerHTML = track.split("-")[0].replaceAll("%20", " ");
        
        // Event listeners for updating UI during playback
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
    try {
        const listRef = ref(storage, "Songs");
        const res = await listAll(listRef);
        console.log(`Fetched albums: ${res.prefixes.length} folders found.`);

        res.prefixes.forEach(async (folderRef) => {
            try {
                const metadataRef = ref(storage, `Songs/${folderRef.name}/info.json`);
                const metadataURL = await getDownloadURL(metadataRef);
                const metadataResponse = await fetch(metadataURL);
                const metadata = await metadataResponse.json();
                console.log(`Fetched metadata for folder: ${folderRef.name}`);

                let cardContainer = document.querySelector(".cardContainer");
                cardContainer.innerHTML += `
                    <div class="card" data-folder="${folderRef.name}">
                        <div class="playBtn">
                            <img src="img/play.svg" alt="playBtn" class="playSvg">
                        </div>
                        <img src="/Songs/${folderRef.name}/cover.jpeg" alt="playlist-img">
                        <h3>${metadata.title}</h3>
                        <p>${metadata.description}</p>
                    </div>`;
            } catch (error) {
                console.error(`Error fetching metadata for folder ${folderRef.name}:`, error);
            }
        });

        // Add event listener to cards
        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener('click', (item) => {
                console.log(`Album clicked: ${item.currentTarget.dataset.folder}`);
                getSongs(`Songs/${item.currentTarget.dataset.folder}`);
            });
        });
    } catch (error) {
        console.error("Failed to display albums:", error);
    }
}

async function main() {
    try {
        await getSongs("Songs/aafavourites");
        playSongs(songs[0], true);

        await displayAlbums();

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
