export const storyText = [
    "In", "a", "world", "overrun", "by", "the", "undead,", "a", "desperate", "father", 
    "must", "venture", "into", "a", "zombie-infested", "forest", "to", "rescue", "his", 
    "children.", "The", "only", "way", "out", "is", "through", "the", "hordes", "of", 
    "flesh-eating", "zombies", "that", "lurk", "in", "the", "shadows.",
    "As", "he", "navigates", "through", "the", "treacherous", "terrain,", "he", "must", 
    "confront", "the", "creatures", "that", "threaten", "to", "tear", "his", "family", 
    "apart.", "At", "the", "third", "level,", "he", "will", "face", "a", "new", 
    "challenge:", "rescuing", "his", "son", "from", "the", "clutches", "of", "a", 
    "terrifying", "zombie.",
    "But", "the", "final", "test", "awaits", "him:", "to", "retrieve", "his", "wife,", 
    "he", "must", "confront", "the", "final", "boss", "lurking", "in", "the", "depths", 
    "of", "the", "forest.", "It", "is", "the", "player’s", "task", "to", "kill", 
    "all", "the", "zombies", "present", "in", "order", "to", "advance", "to", "the", 
    "next", "forest", "and", "save", "his", "family."
];

let currentIndex = 0; // Keep track of the current word
export let storyComplete = false; // Exported flag to indicate if the story has completed


// Function to display the story word by word
export function displayStory(checkIfReadyToClose) {
    const storyContainer = document.getElementById("story-container");
    
    const interval = setInterval(() => {
        if (currentIndex < storyText.length) {
            const p = document.createElement("span") ;
            p.textContent = storyText[currentIndex]+ "   "; // Add next word
            storyContainer.appendChild(p);

            // Use a timeout to apply the visible class after appending
            setTimeout(() => {
                p.classList.add("visible"); // Add class to fade in
            }, 100); // Short delay for better visibility

            currentIndex++;
        } else {
            
            clearInterval(interval); // Stop when all words are displayed
            storyComplete = true; // Mark story as complete
            checkIfReadyToClose(); // Check if both conditions are met
        }
    }, 1000); // Adjust the timing (in milliseconds) to control the speed
}

// Function to finish story early if loading completes
export function finishStory() {
    const storyContainer = document.getElementById("story-container");
    clearInterval(); // Stop the interval when the loading finishes
    currentIndex = storyText.length; // Mark story as complete
    storyContainer.innerHTML = ""; // Clear the story container
    return true
}

