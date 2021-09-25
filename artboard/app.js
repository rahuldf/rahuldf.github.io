const ShopContainer = document.getElementsByClassName("ShopContainer")

var ShopItems = "";


// variables for shop items

const Free_Discord_URL = "https://www.google.com/";
const Paid_Discord_URL = "https://www.abc.xyz";
const Free_DownloadDetails = "Get it on Discord for Free";
const Paid_DownloadDetails = "Get it on Discord for $5"

for(var i=1; i<=4; i++){
    switch(i){
        case 1:
            ItemName = "We Bare Bears";
            DiscordURL = Free_Discord_URL;
            DownloadDetails = Free_DownloadDetails;
            break;
        case 2:
            ItemName = "UnZip Me";
            DiscordURL = Free_Discord_URL;
            DownloadDetails = Free_DownloadDetails;
            break;
        case 3:
            ItemName = "Infinity & Beyond";
            DiscordURL = Paid_Discord_URL;
            DownloadDetails = Paid_DownloadDetails;
            break;
        case 4:
            ItemName = "Bulbaturn";
            DiscordURL = Paid_Discord_URL;
            DownloadDetails = Paid_DownloadDetails;
            break;
        default:
            ItemName = "error";
            DiscordURL = "error";
            DownloadDetails = "error";
            break
    }
    // ShopItems += "<div class=\"item item" + i + "\">\
    //             <a href=\"kyc.html\">\
	// 				<img src=\"images/" + i + ".png\">\
	// 				<p>" + ItemName + "</p>\
	// 				<div class=\"DownloadDetails\">" + DownloadDetails + "</div>\
	// 			</a>\
    //             </div>\n";
    ShopItems += "<div class=\"item item" + i + "\">\
                <a href=" + DiscordURL + " target=\"_blank\" rel=\"noopener noreferrer\" >\
					<img src=\"images/" + i + ".png\">\
					<p>" + ItemName + "</p>\
					<div class=\"DownloadDetails\">" + DownloadDetails + "</div>\
                    <div class=\"item-info\">Wallpaper (Desktop + Mobile)</div>\
				</a>\
                </div>\n";
}

ShopContainer[0].innerHTML = ShopItems;

console.log("JS Working Fine :)")