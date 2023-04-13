const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;//是否在绘制过程
let drawMode = '';//绘画模式：once|multi
let gif = null; //GIF实例对象
//获取页面元素
const brushSizeSelector = document.getElementById('brush-size-selector'); //画笔刷子大小选择器
const colorSelector = document.getElementById('color-selector');//颜色选择器
const nextFrameBtn = document.querySelector('#next-frame-btn');//下一帧按钮
const uploadBtn = document.querySelector('#upload-btn');//上传图片按钮
const endBtn = document.querySelector('#end-btn');//生成动图按钮
const LoadingModal = document.querySelector('.loading');//加载中模态
const drawListBox = document.querySelector('#drawList');//每一帧的列表
const changeModeBtn = document.querySelector('#changeModeBtn');//切换模式按钮
const gifResListBox = document.querySelector('#gifResList');//切换模式按钮

//选择绘制模式
function selectDrawMode() {
  let mode = prompt('请选择是"一次成画"还是"多页面成画"？\r\n😀一次成画：指一个画布上连续绘制，每一笔绘制的过程都会录制动图。\r\n😀多页面成画是：指每次绘制完一个页面需要切换下一个页面绘制下一帧，不会记录笔画。\r\n输入"once"代表一次成画，输入"multi"代表多页面成画', 'multi');
  mode = mode?.trim()
  if (mode === 'once' || mode === 'multi') {
    return mode;
  } else {
    alert('请选择争取的绘制模式');
    selectDrawMode()
  }
}
//切换模式
function changeMode() {

  if (gif.frames.length) {
    let reallyChange = confirm('注意：当前绘画过程中，不建议切换模式！！！如果强行切换，将会导致绘画数据丢失，请再三考虑');
    if (reallyChange) {
      drawMode = '';
      reset()
    }
  } else {
    drawMode = '';
    reset()
  }
}

//初始化函数
function init() {
  //实例化GIF对象
  gif = new GIF({
    workers: 2,
    quality: 5,
    debug: true,
    width: canvas.width,
    height: canvas.height
  });
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'rgb(255, 255, 255)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  //绘画参数选择
  drawMode = drawMode || selectDrawMode();
  document.querySelector('#textDrawMode').textContent = drawMode === 'multi' ? '多页面成画' : '一次成画';
  console.log('你选了', drawMode)
  nextFrameBtn.style.display = drawMode === 'multi' ? 'inline-block' : 'none';
}
// 更新画布列表
function updateDrawList() {
  // 将每一帧输出到Canvas元素中
  drawListBox.innerHTML = '';
  gif.frames.forEach((frame, index) => {
    let w = gif.options.width;
    let h = gif.options.height;
    const imageData = new ImageData(frame.data, w, h);
    const tempCavnas = document.createElement('canvas');
    tempCavnas.width = w;
    tempCavnas.height = h;
    tempCavnas.style.cssText = 'width:100px;height:100px';
    const ctx = tempCavnas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    drawListBox.appendChild(tempCavnas);
  });
}

// 处理图像上传
function handleImageUpload(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const img = new Image();
    img.src = event.target.result;
    img.onload = function () {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  }

  reader.readAsDataURL(file);
}

//添加帧，节流，避免在mousemove事件中过于频繁操作canvas，导致异常
let addFunc = _.throttle(() => {
  console.log('添加画布帧')
  gif.addFrame(ctx, { copy: true, delay: 200 })
}, 200)

// 监听鼠标移动事件以捕获每一帧的像素数据
canvas.addEventListener('mousedown', (event) => {
  ctx.beginPath();
  ctx.moveTo(event.offsetX, event.offsetY);
  isDrawing = true;
});
canvas.addEventListener('mousemove', (event) => {
  if (!isDrawing) {
    return;
  }

  // 绘制代码
  ctx.lineWidth = brushSizeSelector.value;
  ctx.strokeStyle = colorSelector.value;
  ctx.lineTo(event.offsetX, event.offsetY)
  ctx.stroke();
  if (drawMode === 'once') {
    addFunc()
  }
});

canvas.addEventListener('mouseup', () => {
  isDrawing = false;
});
// 绘制下一帧
function drawNextFrame() {
  if (drawMode === 'multi') {
    console.log('添加画布帧')
    gif.addFrame(ctx, { copy: true, delay: 200 })
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    updateDrawList()
  }
}
//重置参数
function reset() {
  gif = null;
  init();
  updateDrawList()
}

// 生成GIF
function generateGif() {
  try {
    LoadingModal.style.display = 'flex';
    gif.on('finished', function (blob) {
      LoadingModal.style.display = 'none';
      const img = document.createElement('img');
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      img.src = url;
      link.href = url;
      link.textContent = '点击下载动图'
      link.download = 'myGif.gif';
      link.appendChild(img)
      gifResListBox.appendChild(link);
      reset();
    });

    gif.render();
  } catch (error) {
    LoadingModal.style.display = 'none';
    alert('已经生成了动图了，何须一直点点点呢')
  }
}


init();
// 点击上传按钮
uploadBtn.addEventListener('change', handleImageUpload);


// 点击下一帧按钮
nextFrameBtn.addEventListener('click', drawNextFrame);

// 点击结束按钮
endBtn.addEventListener('click', generateGif);
//切换模式
changeModeBtn.addEventListener('click', changeMode);