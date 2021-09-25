const ShopContainer = document.getElementsByClassName("ShopContainer")

var ShopItems = "";

var free = false;

// variables for shop items

const Free_Discord_URL = "https://www.google.com/";
const Paid_Discord_URL = "https://www.abc.xyz";
const Free_DownloadDetails = "Get it on Discord for Free";
const Paid_DownloadDetails = "Get it on Discord for $5"

for(var i=10; i>0; i--){
    switch(i){
        case 10:
            ItemName = "RockRocket";
            free = false;
            break;
        case 9:
            ItemName = "Bulbaturn";
            free = false;
            break;
        case 8:
            ItemName = "We Bare Bears";
            free = true;
            break;
        case 7:
            ItemName = "Surprise Poop";
            free = true;
            break;
        case 6:
            ItemName = "Infinity & Beyond";
            free = false;
            break;
        case 5:
            ItemName = "UnZip Me";
            free = true;
            break;
        case 4:
            ItemName = "Beer Bear";
            free = false;
            break;
        case 3:
            ItemName = "SeekDisc";
            free = true;
            break;
        case 2:
            ItemName = "Yes Theory";
            free = true;
            break;
        case 1:
            ItemName = "Infinie Love";
            free = true;
            break;
        default:
            ItemName = "error";
            DiscordURL = "error";
            DownloadDetails = "error";
            break
    }

    if(free==true){
        DiscordURL = Free_Discord_URL;
        DownloadDetails = Free_DownloadDetails
    }
    else{
        DiscordURL = Paid_Discord_URL;
        DownloadDetails = Paid_DownloadDetails
    }

    ShopItems += "<div class=\"item\">\
                <a href=" + DiscordURL + " target=\"_blank\" rel=\"noopener noreferrer\" >\
					<img src=\"shop-images/" + i + ".png\">\
					<p>" + ItemName + "</p>\
					<div class=\"DownloadDetails\">" + DownloadDetails + "</div>\
                    <div class=\"item-info\">Wallpaper (Desktop + Mobile)</div>\
				</a>\
                </div>\n";
}

ShopContainer[0].innerHTML = ShopItems;

console.log("JS Working Fine :)")