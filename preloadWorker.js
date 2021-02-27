/// 20210226 
/// use this file as you want
/// improvment will be welcome
/// based on https://octuweb.com/web-workers/

self.onmessage = async function(event) {
  let tic = performance.now();
  //console.time('worker_blob'); //https://developer.mozilla.org/en-US/docs/Web/API/Console#timers
  let stim = JSON.parse(event.data);
  stim.status = stim.aviableStatus.LOADING;
  console.log(`File ${stim.remoteURL} start loadded in ${tic}ms`);
  await fetch(stim.remoteURL, {mode: 'cors'})
    .then(async response =>{
      if (!response.ok){
        stim.status = stim.aviableStatus.ERROR;
      }
      else {
        console.log(`worker: preloadFile ${stim.remoteURL}`);
        let blob = await response.blob();
        stim.browserURL = URL.createObjectURL(blob);
        stim.status = stim.aviableStatus.LOADED;
      }
    })
    .catch(error =>{
      console.log(`ERROR worker: preloadFile ${stim.remoteURL}, ${error}`);
      stim.status = stim.aviableStatus.ERROR;
    });
  console.log(`File ${stim.remoteURL} ${(performance.now()-tic).toPrecision(4)}ms`);
  //console.timeEnd('worker_blob')
  postMessage(JSON.stringify(stim));
}