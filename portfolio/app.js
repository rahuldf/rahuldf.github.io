console.log("JS Linked!")

// function calcHeight()
//   {
//     //find the height of the internal page
//     // var the_height = document.getElementById('py_notebook').contentWindow.document.body.scrollHeight;
//     var the_height = document.getElementById("py_notebook").contentWindow.document.body.scrollHeight;

//     //change the height of the iframe
//     // document.getElementById('py_notebook').style.height=
//     // the_height;
    
//     alert('This iframe should be ' + the_height + ' pixels in height to avoid scrolling.');
// };

var iframe = document.getElementById("py_notebook")


// iframe.onload( function () {
//     var c = (this.contentWindow || this.contentDocument);
//     if (c.document) d = c.document;
//     $(this).css({
//         height: $(d).outerHeight(),
//         width: $(d).outerWidth()
//     });
// });
// // window.ready(function(){
// // });

// iframe.onload(function(){
//     // this.style.height = this.contentWindow.document.body.offsetHeight + 'px';
//     console.log(iframe.contentWindow.document.body.offsetHeight + 'px');
//     }
// );

// iframe.addEventListener('load',iframe.style.height = "200px");

iframe.addEventListener("load", setTimeout(function () {
    // iframe.style.height = "800px";
    console.log(iframe.contentWindow.document.body.offsetHeight);
}, 000));


// iframe.style.height = 
// iframe.contentWindow.document.body.offsetHeight + 'px'
// this.style.height = this.contentWindow.document.body.offsetHeight + '20px'