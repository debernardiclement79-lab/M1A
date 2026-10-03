const {app, BrowserWindow} = require('electron');
app.whenReady().then(() => {
  const win = new BrowserWindow({width:1280,height:860,backgroundColor:'#080c10',webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
  const target=process.env.M1A_SERVER_URL || 'http://127.0.0.1:3000';
  const origin=new URL(target).origin;
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==origin)event.preventDefault();});
  win.loadURL(target);
});
app.on('window-all-closed',()=>app.quit());
