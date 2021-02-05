const fs = require('fs')
const {ipcRenderer} = require('electron')
// console.log(fs)
// read_file = function(){
//     fs.readdir('D:/文件/漫画/镇魂街', function(err, files){
//         if(err){
//             return console.error(err);
//         }
//         files.forEach(function(file){
//             console.log(file);
//         })
//     })
// }
read_file = function(){
    ipcRenderer.send('open-directory-dialog', 'openDirectory');
    ipcRenderer.once('selectedItem', function(event, path){
        if(path.length > 0){
            console.log(path[0]);
        }
        else{
            console.log('not dir chosen');
        }
    });

}