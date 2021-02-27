'use stric';

var preloadWorker = new Worker('preloadWorker.js');


/// How to preload a file in browser memory
export async function preloadFile(remoteURL){
    let localURL = null;
    
    await fetch(remoteURL)
    .then(async response =>{
      console.log(`Done: preloadFile ${remoteURL}`);
      let blob = await response.blob();
      localURL = URL.createObjectURL(blob);
    })
    .catch(error =>{
      console.log(`ERROR: preloadFile ${remoteURL}, ${error}`);
    });
    
    return localURL;
}


/// preload a file using a class, getting more control
export class Stim{
  static staticAviableStatus = {NONE:0, LOADING:1, LOADED:2, ERROR:3};
  constructor(remoteURL){
    this.remoteURL = remoteURL;
    this.browserURL = null;
    this.aviableStatus = Stim.staticAviableStatus;
    this.status = Stim.staticAviableStatus.NONE;
  }

  async setBrowserURL(){
    this.status = STIM_STATUS_LOADING;

    await fetch(this.remoteURL)
    .then(async response =>{
      if (!response.ok){
        this.status = Stim.aviableStatus.ERROR;
      }
      else {
        console.log(`worker: preloadFile ${stim.remoteURL}`);
        let blob = await response.blob();
        this.browserURL = URL.createObjectURL(blob);
        this.status = Stim.aviableStatus.LOADED;
      }
      console.log(`Done: preloadFile ${this.remoteURL}`);
      let blob = await response.blob();
      this.browserURL = URL.createObjectURL(blob);
      this.status = Stim.staticAviableStatus.LOADED;
    })
    .catch(error =>{
      console.log(`ERROR: preloadFile ${remoteURL}, ${error}`);
      this.status = Stim.staticAviableStatus.ERROR;
    });
  }
}



async function main(){
  /// *** Sample using simple preload
  /// let browserURL = await preloadFile('0.jpg');

  /// *** Sample using class
  /// let stim = new Stim('0.jpg');
  /// stim.setBrowserURL();
  /// let img = document.createElement('img');
  /// img.src = stim.browserURL;
  /// document.body.appendChild(img);
  

  // *** sample using clss and worker
  let stimList = [];
  for(let i=0; i<10; i++){
      let stim = new Stim(`${i}.jpg`);
      stimList.push(stim);
  }
  let stim = new Stim(`a.jpg`);
  stimList.push(stim);
  stim = new Stim(`https://file-examples-com.github.io/uploads/2017/11/file_example_MP3_700KB.mp3`);
  stimList.push(stim);
  stim = new Stim(`https://file-examples-com.github.io/uploads/2017/04/file_example_MP4_480_1_5MG.mp4`);
  stimList.push(stim);

  /// event triggered when all the files list has ben asked to preload
  let eventAllStimLoaded = new Event("AllStimLoaded");

  /// to keep track of how long is the preloading process
  let tic = performance.now();
  /// to keep track of th enumber of files being preload
  let loadingCounter = 0;
  for(let i=0; i<stimList.length; i++){
    stimList[i].status = Stim.staticAviableStatus.LOADING; 
    preloadWorker.postMessage(JSON.stringify(stimList[i]));
    loadingCounter++;
  }


  preloadWorker.onmessage = event => {
      let workerStim = JSON.parse(event.data);
      
      stimList[stimList.findIndex(x => x.remoteURL === workerStim.remoteURL)] = workerStim;
      console.log(`Done: preloadFile ${workerStim.remoteURL}, ${workerStim.status}`);
      loadingCounter--;
      if (loadingCounter==0)
          document.dispatchEvent(eventAllStimLoaded);
  }

  /// wait till all the files has ben asked to preload
  async function waitPreLoad(){
    function success(resolve){
      document.addEventListener("AllStimLoaded", function(e) {
        resolve(0);
      });
    }
    return new Promise(success);
  }

  await waitPreLoad();
  console.log(`Total preload: ${(performance.now()-tic).toPrecision(4)}ms`);

  
  
  /// *** if we wnt to check the failed preload files
  // let failedLoadedStimList = stimList.filter( x => x.status === Stim.staticAviableStatus.ERROR );
  // for(let i=0; i<failedLoadedStimList.length; i++)
  //   console.log(`Unable to preload file: ${failedLoadedStimList[i].remoteURL}`)


  /// just show the file depending of his content type
  for(let i=0; i<stimList.length; i++){
    if (stimList[i].status === Stim.staticAviableStatus.LOADED){
      let blob = await fetch(stimList[i].browserURL).then(r => r.blob());
      console.log(`File: ${stimList[i].remoteURL}, type: ${blob.type}`);
      if (blob.type.includes('image')){
        let img = document.createElement('img');
        img.src = stimList[i].browserURL;
        document.body.appendChild(img);
      }
      if (blob.type.includes('audio')){
        let audio = document.createElement('audio');
        audio.src = stimList[i].browserURL;
        audio.controls = true;
        audio.load();
        document.body.appendChild(audio);
      }
      if (blob.type.includes('video')){
        let video = document.createElement('video');
        video.src = stimList[i].browserURL;
        video.controls = true;
        video.load();
        document.body.appendChild(video);
      }

    }
  }

  
}
main();