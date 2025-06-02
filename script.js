const plotCanvas = document.getElementById('plot');
const ctx = plotCanvas.getContext('2d');
const functionSelect = document.getElementById('functionSelect');
const slidersDiv = document.getElementById('sliders');
const currentExpression = document.getElementById('currentExpression');

let params = { a: 1, b: 1, c: 0, d: 0 };

// 坐标系缩放相关变量
let xRange = 5; // x轴范围 (-5 到 5)
let yRange = 5; // y轴范围 (-5 到 5)
let autoScale = true; // 是否启用自动缩放



function drawAxes() {
    ctx.clearRect(0, 0, plotCanvas.width, plotCanvas.height);
    
    // 绘制网格线
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.4;
    
    // 垂直网格线
    for (let x = 0; x <= plotCanvas.width; x += plotCanvas.width / 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, plotCanvas.height);
        ctx.stroke();
    }
    
    // 水平网格线
    for (let y = 0; y <= plotCanvas.height; y += plotCanvas.height / 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(plotCanvas.width, y);
        ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
    
    // 绘制主坐标轴
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 5;
    
    // X轴
    ctx.beginPath();
    ctx.moveTo(0, plotCanvas.height / 2);
    ctx.lineTo(plotCanvas.width, plotCanvas.height / 2);
    ctx.stroke();
    
    // Y轴
    ctx.beginPath();
    ctx.moveTo(plotCanvas.width / 2, 0);
    ctx.lineTo(plotCanvas.width / 2, plotCanvas.height);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    // 绘制刻度和标签
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // X轴刻度 - 动态计算刻度间隔
    const xStep = Math.max(1, Math.ceil(xRange / 10));
    for (let i = -Math.ceil(xRange); i <= Math.ceil(xRange); i += xStep) {
        if (i === 0) continue;
        const x = plotCanvas.width / 2 + (i / xRange) * (plotCanvas.width / 2);
        
        // 只绘制在画布范围内的刻度
        if (x >= 0 && x <= plotCanvas.width) {
            // 刻度线
            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, plotCanvas.height / 2 - 5);
            ctx.lineTo(x, plotCanvas.height / 2 + 5);
            ctx.stroke();
            
            // 标签
            ctx.fillText(i.toString(), x, plotCanvas.height / 2 + 20);
        }
    }
    
    // Y轴刻度 - 动态计算刻度间隔
    ctx.textAlign = 'right';
    const yStep = Math.max(1, Math.ceil(yRange / 10));
    for (let i = -Math.ceil(yRange); i <= Math.ceil(yRange); i += yStep) {
        if (i === 0) continue;
        const y = plotCanvas.height / 2 - (i / yRange) * (plotCanvas.height / 2);
        
        // 只绘制在画布范围内的刻度
        if (y >= 0 && y <= plotCanvas.height) {
            // 刻度线
            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(plotCanvas.width / 2 - 5, y);
            ctx.lineTo(plotCanvas.width / 2 + 5, y);
            ctx.stroke();
            
            // 标签
            ctx.fillText(i.toString(), plotCanvas.width / 2 - 10, y + 4);
        }
    }
    
    // 原点标签
    ctx.textAlign = 'right';
    ctx.fillText('0', plotCanvas.width / 2 - 10, plotCanvas.height / 2 + 15);
    
    // 坐标轴箭头
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 3;
    
    // X轴箭头
    ctx.beginPath();
    ctx.moveTo(plotCanvas.width - 10, plotCanvas.height / 2 - 5);
    ctx.lineTo(plotCanvas.width - 2, plotCanvas.height / 2);
    ctx.lineTo(plotCanvas.width - 10, plotCanvas.height / 2 + 5);
    ctx.closePath();
    ctx.fill();
    
    // Y轴箭头
    ctx.beginPath();
    ctx.moveTo(plotCanvas.width / 2 - 5, 10);
    ctx.lineTo(plotCanvas.width / 2, 2);
    ctx.lineTo(plotCanvas.width / 2 + 5, 10);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // 坐标轴标签
    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('x', plotCanvas.width - 15, plotCanvas.height / 2 - 10);
    ctx.fillText('y', plotCanvas.width / 2 + 15, 15);
}

function drawPlot() {
    ctx.clearRect(0, 0, plotCanvas.width, plotCanvas.height);
    drawAxes();
    
    // 绘制函数曲线
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff6b6b';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    
    // 用于收集特征点的数组
    let featurePoints = [];
    let zeroPoints = [];
    let extremePoints = [];
    let inflectionPoints = [];
    let domainBoundaries = [];
    
    let firstPoint = true;
    for (let x = 0; x < plotCanvas.width; x++) {
        const scaledX = (x / plotCanvas.width) * (xRange * 2) - xRange;
        let y;
        
        try {
            if (functionSelect.value === 'linear') {
                y = params.a * scaledX + params.b;
            } else if (functionSelect.value === 'quadratic') {
                y = params.a * scaledX * scaledX + params.b * scaledX + params.c;
            } else if (functionSelect.value === 'power') {
                if (scaledX < 0 && params.b % 1 !== 0) continue; // 避免负数的非整数次幂
                y = params.a * Math.pow(scaledX, params.b) + params.c;
            } else if (functionSelect.value === 'inverse') {
                if (Math.abs(scaledX) < 0.001) continue; // 避免除零
                y = params.a / scaledX + params.b;
            } else if (functionSelect.value === 'sqrt') {
                const sqrtArg = params.b * scaledX + params.c;
                if (sqrtArg < 0) continue; // 跳过负数开方
                y = params.a * Math.sqrt(sqrtArg) + params.d;
            } else if (functionSelect.value === 'abs') {
                y = params.a * Math.abs(params.b * scaledX + params.c) + params.d;
            } else if (functionSelect.value === 'sin') {
                y = params.a * Math.sin(params.b * scaledX + params.c) + params.d;
            } else if (functionSelect.value === 'cos') {
                y = params.a * Math.cos(params.b * scaledX + params.c) + params.d;
            } else if (functionSelect.value === 'tan') {
                const tanArg = params.b * scaledX + params.c;
                // 避免在渐近线处绘制
                if (Math.abs(Math.cos(tanArg)) < 0.001) continue;
                y = params.a * Math.tan(tanArg) + params.d;
            } else if (functionSelect.value === 'exp') {
                y = params.a * Math.exp(params.b * scaledX) + params.c;
            } else if (functionSelect.value === 'log') {
                const logArg = params.b * scaledX + params.c;
                if (logArg <= 0) continue; // 跳过无效的对数值
                y = params.a * Math.log(logArg) + params.d;
            } else if (functionSelect.value === 'piecewise') {
                // 简单的分段函数示例: y = ax+b (x<0), y = cx²+d (x≥0)
                if (scaledX < 0) {
                    y = params.a * scaledX + params.b;
                } else {
                    y = params.c * scaledX * scaledX + params.d;
                }
            }
            
            // 检查y值是否有效
            if (isNaN(y) || !isFinite(y)) continue;
            
            const scaledY = plotCanvas.height / 2 - (y / yRange) * (plotCanvas.height / 2);
            
            // 只绘制在画布范围内的点
            if (scaledY >= -50 && scaledY <= plotCanvas.height + 50) {
                if (firstPoint) {
                    ctx.moveTo(x, scaledY);
                    firstPoint = false;
                } else {
                    ctx.lineTo(x, scaledY);
                }
            } else {
                firstPoint = true;
            }
        } catch (e) {
            firstPoint = true;
            continue;
        }
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0; // 重置阴影
    
    // 计算并绘制特征点
    calculateFeaturePoints(featurePoints, zeroPoints, extremePoints, inflectionPoints, domainBoundaries);
    
    // 绘制特征点
    // 绘制零点（绿色）
    zeroPoints.forEach(point => {
        drawFeaturePoint(point.x, point.y, '零点', '#00ff00', '#008800');
    });
    
    // 绘制极值点（粉色为最大值，青色为最小值）
    extremePoints.forEach(point => {
        const fillColor = point.type === 'max' ? '#ff69b4' : '#00ffff';
        const strokeColor = point.type === 'max' ? '#cc1477' : '#0099cc';
        const label = point.type === 'max' ? '最大值' : '最小值';
        drawFeaturePoint(point.x, point.y, label, fillColor, strokeColor);
    });
    
    // 绘制拐点（黄色）
    inflectionPoints.forEach(point => {
        drawFeaturePoint(point.x, point.y, '拐点', '#ffff00', '#cccc00');
    });
    
    // 绘制定义域边界（橙色）
    domainBoundaries.forEach(point => {
        drawFeaturePoint(point.x, point.y || 0, '边界', '#ffa500', '#cc8400');
    });
    
    // 绘制当前输入x值对应的坐标点
    drawCurrentPoint();
}

// 自动调整坐标系范围
function adjustScale(x, y) {
    if (!autoScale) return;
    
    let needsRedraw = false;
    
    // 检查x值是否超出范围，留出20%的边距
    if (Math.abs(x) > xRange * 0.8) {
        xRange = Math.max(5, Math.ceil(Math.abs(x) * 1.5));
        needsRedraw = true;
    }
    
    // 检查y值是否超出范围，留出20%的边距
    if (Math.abs(y) > yRange * 0.8) {
        yRange = Math.max(5, Math.ceil(Math.abs(y) * 1.5));
        needsRedraw = true;
    }
    
    return needsRedraw;
}

// 切换自动缩放功能
function toggleAutoScale() {
    autoScale = !autoScale;
    const btn = document.getElementById('autoScaleBtn');
    btn.textContent = `自动缩放: ${autoScale ? '开启' : '关闭'}`;
    btn.style.backgroundColor = autoScale ? '#4ade80' : '#ef4444';
}

// 重置坐标系缩放
function resetScale() {
    xRange = 5;
    yRange = 5;
    drawPlot();
}

function drawCurrentPoint() {
    const xInput = document.getElementById('xInput');
    if (!xInput || !xInput.value) return;
    
    const inputX = parseFloat(xInput.value);
    if (isNaN(inputX)) return;
    
    // 计算对应的y值
    let y;
    try {
         if (functionSelect.value === 'linear') {
             y = params.a * inputX + params.b;
         } else if (functionSelect.value === 'quadratic') {
             y = params.a * inputX * inputX + params.b * inputX + params.c;
         } else if (functionSelect.value === 'power') {
             if (inputX < 0 && params.b % 1 !== 0) return; // 避免负数的非整数次幂
             y = params.a * Math.pow(inputX, params.b) + params.c;
         } else if (functionSelect.value === 'inverse') {
             if (Math.abs(inputX) < 0.001) return; // 避免除零
             y = params.a / inputX + params.b;
         } else if (functionSelect.value === 'sqrt') {
             const sqrtArg = params.b * inputX + params.c;
             if (sqrtArg < 0) return; // 跳过负数开方
             y = params.a * Math.sqrt(sqrtArg) + params.d;
         } else if (functionSelect.value === 'abs') {
             y = params.a * Math.abs(params.b * inputX + params.c) + params.d;
         } else if (functionSelect.value === 'sin') {
             y = params.a * Math.sin(params.b * inputX + params.c) + params.d;
         } else if (functionSelect.value === 'cos') {
             y = params.a * Math.cos(params.b * inputX + params.c) + params.d;
         } else if (functionSelect.value === 'tan') {
             const tanArg = params.b * inputX + params.c;
             if (Math.abs(Math.cos(tanArg)) < 0.001) return; // 避免渐近线
             y = params.a * Math.tan(tanArg) + params.d;
         } else if (functionSelect.value === 'exp') {
             y = params.a * Math.exp(params.b * inputX) + params.c;
         } else if (functionSelect.value === 'log') {
             const logArg = params.b * inputX + params.c;
             if (logArg <= 0) return;
             y = params.a * Math.log(logArg) + params.d;
         } else if (functionSelect.value === 'piecewise') {
             // 简单的分段函数示例: y = ax+b (x<0), y = cx²+d (x≥0)
             if (inputX < 0) {
                 y = params.a * inputX + params.b;
             } else {
                 y = params.c * inputX * inputX + params.d;
             }
         }
        
        if (isNaN(y) || !isFinite(y)) return;
        
        // 自动调整坐标系范围
        if (adjustScale(inputX, y)) {
            // 如果范围发生变化，重新绘制整个图形
            drawPlot();
            return;
        }
        
        // 转换为画布坐标
        const canvasX = plotCanvas.width / 2 + (inputX / xRange) * (plotCanvas.width / 2);
        const canvasY = plotCanvas.height / 2 - (y / yRange) * (plotCanvas.height / 2);
        
        // 检查点是否在画布范围内
        if (canvasX >= 0 && canvasX <= plotCanvas.width && canvasY >= 0 && canvasY <= plotCanvas.height) {
            // 绘制坐标点
            ctx.fillStyle = '#ffff00';
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(canvasX, canvasY, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            // 绘制坐标标签
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            
            const labelText = `(${inputX}, ${y.toFixed(3)})`;
            const labelX = canvasX;
            const labelY = canvasY - 15;
            
            // 绘制文字描边
            ctx.strokeText(labelText, labelX, labelY);
            // 绘制文字填充
            ctx.fillText(labelText, labelX, labelY);
            
            // 绘制辅助线
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            
            // 垂直辅助线
            ctx.moveTo(canvasX, plotCanvas.height / 2);
            ctx.lineTo(canvasX, canvasY);
            
            // 水平辅助线
            ctx.moveTo(plotCanvas.width / 2, canvasY);
            ctx.lineTo(canvasX, canvasY);
            
            ctx.stroke();
            ctx.setLineDash([]); // 重置虚线
        }
    } catch (e) {
        console.error('绘制坐标点时出错:', e);
    }
}

// 计算函数值的辅助函数
function calculateFunctionValue(x) {
    const funcType = functionSelect.value;
    let y;
    
    try {
        if (funcType === 'linear') {
            y = params.a * x + params.b;
        } else if (funcType === 'quadratic') {
            y = params.a * x * x + params.b * x + params.c;
        } else if (funcType === 'power') {
            if (x < 0 && params.b % 1 !== 0) return null;
            y = params.a * Math.pow(x, params.b) + params.c;
        } else if (funcType === 'inverse') {
            if (Math.abs(x) < 0.001) return null;
            y = params.a / x + params.b;
        } else if (funcType === 'sqrt') {
            const sqrtArg = params.b * x + params.c;
            if (sqrtArg < 0) return null;
            y = params.a * Math.sqrt(sqrtArg) + params.d;
        } else if (funcType === 'abs') {
            y = params.a * Math.abs(params.b * x + params.c) + params.d;
        } else if (funcType === 'sin') {
            y = params.a * Math.sin(params.b * x + params.c) + params.d;
        } else if (funcType === 'cos') {
            y = params.a * Math.cos(params.b * x + params.c) + params.d;
        } else if (funcType === 'tan') {
            const tanArg = params.b * x + params.c;
            if (Math.abs(Math.cos(tanArg)) < 0.001) return null;
            y = params.a * Math.tan(tanArg) + params.d;
        } else if (funcType === 'exp') {
            y = params.a * Math.exp(params.b * x) + params.c;
        } else if (funcType === 'log') {
            const logArg = params.b * x + params.c;
            if (logArg <= 0) return null;
            y = params.a * Math.log(logArg) + params.d;
        } else if (funcType === 'piecewise') {
            if (x < 0) {
                y = params.a * x + params.b;
            } else {
                y = params.c * x * x + params.d;
            }
        }
        
        return isNaN(y) || !isFinite(y) ? null : y;
    } catch (e) {
        return null;
    }
}

// 计算特征点
function calculateFeaturePoints(featurePoints, zeroPoints, extremePoints, inflectionPoints, domainBoundaries) {
    const funcType = functionSelect.value;
    
    // 计算零点（简化版本，仅对部分函数类型）
    if (funcType === 'linear') {
        if (params.a !== 0) {
            const zeroX = -params.b / params.a;
            if (zeroX >= -xRange && zeroX <= xRange) {
                zeroPoints.push({ x: zeroX, y: 0 });
            }
        }
    } else if (funcType === 'quadratic') {
        const discriminant = params.b * params.b - 4 * params.a * params.c;
        if (discriminant >= 0 && params.a !== 0) {
            const x1 = (-params.b + Math.sqrt(discriminant)) / (2 * params.a);
            const x2 = (-params.b - Math.sqrt(discriminant)) / (2 * params.a);
            if (x1 >= -xRange && x1 <= xRange) zeroPoints.push({ x: x1, y: 0 });
            if (x2 >= -xRange && x2 <= xRange && x1 !== x2) zeroPoints.push({ x: x2, y: 0 });
        }
        
        // 二次函数的顶点（极值点）
        if (params.a !== 0) {
            const vertexX = -params.b / (2 * params.a);
            const vertexY = calculateFunctionValue(vertexX);
            if (vertexX >= -xRange && vertexX <= xRange && vertexY !== null) {
                extremePoints.push({ 
                    x: vertexX, 
                    y: vertexY, 
                    type: params.a > 0 ? 'min' : 'max' 
                });
            }
        }
    } else if (funcType === 'abs') {
        // 绝对值函数的顶点
        if (params.b !== 0) {
            const vertexX = -params.c / params.b;
            const vertexY = params.d;
            if (vertexX >= -xRange && vertexX <= xRange) {
                extremePoints.push({ 
                    x: vertexX, 
                    y: vertexY, 
                    type: params.a > 0 ? 'min' : 'max' 
                });
            }
        }
    } else if (funcType === 'sin' || funcType === 'cos') {
        // 三角函数的极值点（简化计算）
        const period = Math.abs(2 * Math.PI / params.b);
        for (let k = -2; k <= 2; k++) {
            let extremeX;
            if (funcType === 'sin') {
                extremeX = (Math.PI / 2 + k * Math.PI - params.c) / params.b;
            } else {
                extremeX = (k * Math.PI - params.c) / params.b;
            }
            
            if (extremeX >= -xRange && extremeX <= xRange) {
                const extremeY = calculateFunctionValue(extremeX);
                if (extremeY !== null) {
                    const isMax = (funcType === 'sin' && k % 2 === 0) || (funcType === 'cos' && k % 2 === 1);
                    extremePoints.push({ 
                        x: extremeX, 
                        y: extremeY, 
                        type: (params.a > 0) === isMax ? 'max' : 'min' 
                    });
                }
            }
        }
    }
    
    // 标记定义域边界
    if (funcType === 'sqrt') {
        const boundaryX = -params.c / params.b;
        if (boundaryX >= -xRange && boundaryX <= xRange) {
            domainBoundaries.push({ x: boundaryX, y: params.d });
        }
    } else if (funcType === 'log') {
        const boundaryX = -params.c / params.b;
        if (boundaryX >= -xRange && boundaryX <= xRange) {
            domainBoundaries.push({ x: boundaryX, y: null });
        }
    }
}

// 绘制特征点
function drawFeaturePoint(x, y, label, fillColor, strokeColor) {
    // 转换为画布坐标
    const canvasX = plotCanvas.width / 2 + (x / xRange) * (plotCanvas.width / 2);
    const canvasY = plotCanvas.height / 2 - (y / yRange) * (plotCanvas.height / 2);
    
    // 检查点是否在画布范围内
    if (canvasX >= 0 && canvasX <= plotCanvas.width && canvasY >= 0 && canvasY <= plotCanvas.height) {
        // 绘制特征点
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // 绘制标签
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        
        const labelText = `${label}(${x.toFixed(2)}, ${y !== null && y !== undefined ? y.toFixed(2) : '0'})`;
        const labelY = canvasY - 10;
        
        // 绘制文字描边和填充
        ctx.strokeText(labelText, canvasX, labelY);
        ctx.fillText(labelText, canvasX, labelY);
    }
}

function createSliders() {
    slidersDiv.innerHTML = '';
    const funcType = functionSelect.value;
    
    let sliderConfigs = [];
    
    if (funcType === 'linear') {
        sliderConfigs = [
            { name: 'a', min: -5, max: 5, step: 0.1, default: 1, label: '斜率 a' },
            { name: 'b', min: -10, max: 10, step: 0.1, default: 0, label: '截距 b' }
        ];
    } else if (funcType === 'quadratic') {
        sliderConfigs = [
            { name: 'a', min: -3, max: 3, step: 0.1, default: 1, label: '二次项系数 a' },
            { name: 'b', min: -5, max: 5, step: 0.1, default: 0, label: '一次项系数 b' },
            { name: 'c', min: -10, max: 10, step: 0.1, default: 0, label: '常数项 c' }
        ];
    } else if (funcType === 'power') {
        sliderConfigs = [
            { name: 'a', min: -3, max: 3, step: 0.1, default: 1, label: '系数 a' },
            { name: 'b', min: -3, max: 3, step: 0.1, default: 2, label: '指数 b' },
            { name: 'c', min: -5, max: 5, step: 0.1, default: 0, label: '垂直偏移 c' }
        ];
    } else if (funcType === 'inverse') {
        sliderConfigs = [
            { name: 'a', min: -5, max: 5, step: 0.1, default: 1, label: '系数 a' },
            { name: 'b', min: -5, max: 5, step: 0.1, default: 0, label: '垂直偏移 b' }
        ];
    } else if (funcType === 'sqrt') {
        sliderConfigs = [
            { name: 'a', min: -3, max: 3, step: 0.1, default: 1, label: '系数 a' },
            { name: 'b', min: 0.1, max: 3, step: 0.1, default: 1, label: '根号内系数 b' },
            { name: 'c', min: -5, max: 5, step: 0.1, default: 0, label: '根号内偏移 c' },
            { name: 'd', min: -5, max: 5, step: 0.1, default: 0, label: '垂直偏移 d' }
        ];
    } else if (funcType === 'abs') {
        sliderConfigs = [
            { name: 'a', min: -3, max: 3, step: 0.1, default: 1, label: '系数 a' },
            { name: 'b', min: -3, max: 3, step: 0.1, default: 1, label: '绝对值内系数 b' },
            { name: 'c', min: -5, max: 5, step: 0.1, default: 0, label: '绝对值内偏移 c' },
            { name: 'd', min: -5, max: 5, step: 0.1, default: 0, label: '垂直偏移 d' }
        ];
    } else if (funcType === 'sin' || funcType === 'cos' || funcType === 'tan') {
        sliderConfigs = [
            { name: 'a', min: -3, max: 3, step: 0.1, default: 1, label: '振幅 a' },
            { name: 'b', min: -3, max: 3, step: 0.1, default: 1, label: '频率 b' },
            { name: 'c', min: -Math.PI, max: Math.PI, step: 0.1, default: 0, label: '相位 c' },
            { name: 'd', min: -5, max: 5, step: 0.1, default: 0, label: '垂直偏移 d' }
        ];
    } else if (funcType === 'exp') {
        sliderConfigs = [
            { name: 'a', min: -3, max: 3, step: 0.1, default: 1, label: '系数 a' },
            { name: 'b', min: -2, max: 2, step: 0.1, default: 1, label: '指数系数 b' },
            { name: 'c', min: -5, max: 5, step: 0.1, default: 0, label: '垂直偏移 c' }
        ];
    } else if (funcType === 'log') {
        sliderConfigs = [
            { name: 'a', min: -3, max: 3, step: 0.1, default: 1, label: '系数 a' },
            { name: 'b', min: 0.1, max: 3, step: 0.1, default: 1, label: '底数系数 b' },
            { name: 'c', min: -2, max: 2, step: 0.1, default: 0, label: '水平偏移 c' },
            { name: 'd', min: -5, max: 5, step: 0.1, default: 0, label: '垂直偏移 d' }
        ];
    } else if (funcType === 'piecewise') {
        sliderConfigs = [
            { name: 'a', min: -3, max: 3, step: 0.1, default: 1, label: '左段斜率 a' },
            { name: 'b', min: -5, max: 5, step: 0.1, default: 0, label: '左段截距 b' },
            { name: 'c', min: -2, max: 2, step: 0.1, default: 1, label: '右段二次项 c' },
            { name: 'd', min: -5, max: 5, step: 0.1, default: 0, label: '右段常数项 d' }
        ];
    }
    
    // 重置参数
    params = {};
    
    sliderConfigs.forEach(config => {
        params[config.name] = config.default;
        
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';
        
        const label = document.createElement('label');
        label.textContent = `${config.label}: ${config.default}`;
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = config.min;
        slider.max = config.max;
        slider.step = config.step;
        slider.value = config.default;
        
        slider.addEventListener('input', function() {
            const value = parseFloat(this.value);
            params[config.name] = value;
            label.textContent = `${config.label}: ${value}`;
            updateExpression();
            drawPlot();
        });
        
        sliderContainer.appendChild(label);
        sliderContainer.appendChild(slider);
        slidersDiv.appendChild(sliderContainer);
    });
}

functionSelect.addEventListener('change', () => {
    // 重置参数到初始状态
    params = { a: 1, b: 1, c: 0, d: 0 };
    
    // 清空x输入框
    const xInput = document.getElementById('xInput');
    if (xInput) {
        xInput.value = '';
    }
    
    createSliders();
    updateExpression();
    drawPlot();
});

createSliders();
updateExpression();
drawPlot();

function updateExpression() {
    const funcType = functionSelect.value;
    let characteristics = '';
    let expression = '';
    if (funcType === 'linear') {
        characteristics = `斜率: ${params.a}, y截距: ${params.b}, 单调性: ${params.a > 0 ? '递增' : params.a < 0 ? '递减' : '常数'}`;
        expression = `y = ${params.a} * x + ${params.b}`;
    } else if (funcType === 'quadratic') {
        const vertex_x = -params.b / (2 * params.a);
        const vertex_y = params.a * vertex_x * vertex_x + params.b * vertex_x + params.c;
        const discriminant = params.b * params.b - 4 * params.a * params.c;
        characteristics = `开口: ${params.a > 0 ? '向上' : '向下'}, 顶点: (${vertex_x.toFixed(2)}, ${vertex_y.toFixed(2)}), 判别式: ${discriminant.toFixed(2)}`;
        expression = `y = ${params.a} * x² + ${params.b} * x + ${params.c}`;
    } else if (funcType === 'power') {
        characteristics = `幂次: ${params.b}, 定义域: ${params.b % 1 === 0 ? 'R' : 'x≥0'}, 单调性: ${params.b > 0 ? '递增' : '递减'}`;
        expression = `y = ${params.a} * x^${params.b} + ${params.c}`;
    } else if (funcType === 'inverse') {
        characteristics = `定义域: x≠0, 值域: y≠${params.b}, 渐近线: x=0, y=${params.b}`;
        expression = `y = ${params.a} / x + ${params.b}`;
    } else if (funcType === 'sqrt') {
        const domain_start = -params.c / params.b;
        characteristics = `定义域: x≥${domain_start.toFixed(2)}, 值域: y≥${params.d}, 单调性: 递增`;
        expression = `y = ${params.a} * √(${params.b} * x + ${params.c}) + ${params.d}`;
    } else if (funcType === 'abs') {
        const vertex_x = -params.c / params.b;
        characteristics = `顶点: (${vertex_x.toFixed(2)}, ${params.d}), 对称轴: x=${vertex_x.toFixed(2)}, 值域: y≥${params.d}`;
        expression = `y = ${params.a} * |${params.b} * x + ${params.c}| + ${params.d}`;
    } else if (funcType === 'sin') {
        const period = Math.abs(2 * Math.PI / params.b);
        characteristics = `振幅: ${Math.abs(params.a)}, 周期: ${period.toFixed(2)}, 相位: ${params.c}, 垂直位移: ${params.d}`;
        expression = `y = ${params.a} * sin(${params.b} * x + ${params.c}) + ${params.d}`;
    } else if (funcType === 'cos') {
        const period = Math.abs(2 * Math.PI / params.b);
        characteristics = `振幅: ${Math.abs(params.a)}, 周期: ${period.toFixed(2)}, 相位: ${params.c}, 垂直位移: ${params.d}`;
        expression = `y = ${params.a} * cos(${params.b} * x + ${params.c}) + ${params.d}`;
    } else if (funcType === 'tan') {
        const period = Math.abs(Math.PI / params.b);
        characteristics = `周期: ${period.toFixed(2)}, 渐近线间距: ${period.toFixed(2)}, 垂直位移: ${params.d}`;
        expression = `y = ${params.a} * tan(${params.b} * x + ${params.c}) + ${params.d}`;
    } else if (funcType === 'exp') {
        characteristics = `底数: e, 增长率: ${params.b > 0 ? '指数增长' : '指数衰减'}, 水平渐近线: y=${params.c}`;
        expression = `y = ${params.a} * e^(${params.b} * x) + ${params.c}`;
    } else if (funcType === 'log') {
        const domain_start = -params.c / params.b;
        characteristics = `底数: e, 定义域: x>${domain_start.toFixed(2)}, 垂直渐近线: x=${domain_start.toFixed(2)}`;
        expression = `y = ${params.a} * ln(${params.b} * x + ${params.c}) + ${params.d}`;
    } else if (funcType === 'piecewise') {
        characteristics = `分段点: x=0, 左段: 一次函数, 右段: 二次函数`;
        expression = `y = {${params.a}x+${params.b} (x<0), ${params.c}x²+${params.d} (x≥0)}`;
    }
    currentExpression.textContent = `${expression} | 特性: ${characteristics}`;
    
    // 更新方程输入框
    updateEquationInput();
}

function updateEquationInput() {
    const equationInput = document.getElementById('equationInput');
    if (!equationInput) return;
    
    const funcType = functionSelect.value;
    let equation = '';
    
    if (funcType === 'linear') {
        equation = `${params.a}*x+${params.b}=y`;
    } else if (funcType === 'quadratic') {
        equation = `${params.a}*x^2+${params.b}*x+${params.c}=y`;
    } else if (funcType === 'power') {
        equation = `${params.a}*x^${params.b}+${params.c}=y`;
    } else if (funcType === 'inverse') {
        equation = `${params.a}/x+${params.b}=y`;
    } else if (funcType === 'sqrt') {
        equation = `${params.a}*sqrt(${params.b}*x+${params.c})+${params.d}=y`;
    } else if (funcType === 'abs') {
        equation = `${params.a}*abs(${params.b}*x+${params.c})+${params.d}=y`;
    } else if (funcType === 'sin') {
        equation = `${params.a}*sin(${params.b}*x+${params.c})+${params.d}=y`;
    } else if (funcType === 'cos') {
        equation = `${params.a}*cos(${params.b}*x+${params.c})+${params.d}=y`;
    } else if (funcType === 'tan') {
        equation = `${params.a}*tan(${params.b}*x+${params.c})+${params.d}=y`;
    } else if (funcType === 'exp') {
        equation = `${params.a}*exp(${params.b}*x)+${params.c}=y`;
    } else if (funcType === 'log') {
        equation = `${params.a}*ln(${params.b}*x+${params.c})+${params.d}=y`;
    } else if (funcType === 'piecewise') {
        equation = `x<0 ? ${params.a}*x+${params.b} : ${params.c}*x^2+${params.d}=y`;
    }
    
    equationInput.value = equation;
}

function solveEquation(equation, xValue) {
    console.log('输入方程:', equation, '输入x值:', xValue);
    
    // 使用现有的calculateFunctionValue函数来计算y值
    const yValue = calculateFunctionValue(xValue);
    
    if (yValue === null) {
        const funcType = functionSelect.value;
        let errorMsg = '在此点函数值未定义';
        
        if (funcType === 'tan') {
            errorMsg = '在此点正切函数未定义（渐近线）';
        } else if (funcType === 'log') {
            errorMsg = '对数函数的参数必须大于0';
        } else if (funcType === 'sqrt') {
            errorMsg = '平方根函数的参数不能为负数';
        } else if (funcType === 'inverse') {
            errorMsg = '反比例函数在x=0处未定义';
        } else if (funcType === 'power') {
            errorMsg = '幂函数在此点未定义（负数的非整数次幂）';
        }
        
        alert(errorMsg);
        return NaN;
    }
    
    console.log('最终计算结果:', yValue);
    return yValue;
}

function addInteractiveExercises() {
    // 绑定求解按钮事件
    const solveButton = document.getElementById('solveBtn');
    const equationInput = document.getElementById('equationInput');
    const xInput = document.getElementById('xInput');
    
    if (solveButton && equationInput && xInput) {
        solveButton.addEventListener('click', () => {
            const xValue = parseFloat(xInput.value);
            if (isNaN(xValue)) {
                showResult('请输入有效的 x 值！', 'error');
                return;
            }
            
            const yValue = solveEquation(equationInput.value, xValue);
            if (!isNaN(yValue)) {
                showResult(`当 x = ${xValue} 时，y = ${yValue.toFixed(4)}`, 'success');
            }
        });
        
        // 支持回车键求解
        xInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                solveButton.click();
            }
        });
        
        // 实时更新坐标点显示
        xInput.addEventListener('input', () => {
            drawPlot(); // 重新绘制图像，包括新的坐标点
        });
        
        // 当x输入框失去焦点时也更新
        xInput.addEventListener('blur', () => {
            drawPlot();
        });
    }
    
    // 初始化方程输入框
    updateEquationInput();
}

function showResult(message, type) {
    // 创建或更新结果显示区域
    let resultDiv = document.getElementById('result-display');
    if (!resultDiv) {
        resultDiv = document.createElement('div');
        resultDiv.id = 'result-display';
        resultDiv.style.cssText = `
            margin-top: 16px;
            padding: 12px 16px;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            transition: all 0.3s ease;
        `;
        document.querySelector('.solver-container').appendChild(resultDiv);
    }
    
    if (type === 'success') {
        resultDiv.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        resultDiv.style.color = 'white';
        resultDiv.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.3)';
    } else {
        resultDiv.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        resultDiv.style.color = 'white';
        resultDiv.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.3)';
    }
    
    resultDiv.textContent = message;
    resultDiv.style.opacity = '0';
    resultDiv.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
        resultDiv.style.opacity = '1';
        resultDiv.style.transform = 'translateY(0)';
    }, 100);
}

// 初始化所有功能
functionSelect.addEventListener('change', () => {
    // 切换函数时自动重置缩放
    xRange = 5;
    yRange = 5;
    createSliders();
    updateExpression();
    drawPlot();
    updateEquationInput();
});

// 菜单功能实现
function downloadImage() {
    const canvas = document.getElementById('plot');
    const link = document.createElement('a');
    
    // 创建一个新的canvas来添加白色背景
    const downloadCanvas = document.createElement('canvas');
    const downloadCtx = downloadCanvas.getContext('2d');
    downloadCanvas.width = canvas.width;
    downloadCanvas.height = canvas.height;
    
    // 添加白色背景
    downloadCtx.fillStyle = '#ffffff';
    downloadCtx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);
    
    // 绘制原始canvas内容
    downloadCtx.drawImage(canvas, 0, 0);
    
    // 添加函数信息
    downloadCtx.fillStyle = '#000000';
    downloadCtx.font = '16px Arial';
    downloadCtx.fillText(`函数: ${currentExpression.textContent}`, 10, 25);
    downloadCtx.fillText(`开发者: 兰州五十一中 高一九班 雷雨涵`, 10, downloadCanvas.height - 10);
    
    // 下载图像
    link.download = `数学函数图像_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = downloadCanvas.toDataURL('image/png');
    link.click();
    
    // 显示成功提示
    showResult('图像下载成功！', 'success');
}

function printPage() {
    // 保存当前的canvas内容
    const canvas = document.getElementById('plot');
    const dataURL = canvas.toDataURL('image/png');
    
    // 创建打印窗口
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>数学函数图像 - 打印</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    text-align: center;
                }
                .header {
                    margin-bottom: 20px;
                }
                .function-info {
                    font-size: 18px;
                    font-weight: bold;
                    margin: 10px 0;
                }
                .developer-info {
                    margin-top: 20px;
                    font-size: 14px;
                    color: #666;
                }
                img {
                    max-width: 100%;
                    border: 1px solid #ccc;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 数学函数探索器</h1>
                <div class="function-info">当前函数: ${currentExpression.textContent}</div>
            </div>
            <img src="${dataURL}" alt="函数图像">
            <div class="developer-info">
                <p>开发者：兰州五十一中 高一九班 雷雨涵</p>
                <p>打印时间：${new Date().toLocaleString()}</p>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // 等待图像加载后打印
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

function showAbout() {
    document.getElementById('aboutModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('aboutModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// ESC键关闭模态框
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal('aboutModal');
    }
});

// 响应式Canvas调整
function resizeCanvas() {
    const canvas = document.getElementById('plot');
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    
    if (window.innerWidth <= 768) {
        canvas.width = Math.min(containerWidth - 20, 600);
        canvas.height = 300;
    } else if (window.innerWidth <= 1024) {
        canvas.width = Math.min(containerWidth - 20, 700);
        canvas.height = 350;
    } else {
        canvas.width = 800;
        canvas.height = 400;
    }
    
    // 重新绘制
    drawPlot();
}

// 窗口大小改变时调整canvas
window.addEventListener('resize', resizeCanvas);

// 典型例题功能
let examplesData = {};
let currentFilter = 'current'; // 默认显示当前函数类型的例题
let formulaModal = null; // 公式弹窗模态框

// 加载例题数据
async function loadExamples() {
    try {
        console.log('开始加载例题数据...');
        const response = await fetch('examples.json');
        console.log('Fetch响应状态:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('成功解析JSON数据:', Object.keys(data));
        examplesData = data;
        displayExamples();
    } catch (error) {
        console.error('加载例题数据失败:', error);
        const errorMessage = error.message || '未知错误';
        document.getElementById('examplesList').innerHTML = `<div class="loading-message">加载例题失败: ${errorMessage}<br>请检查浏览器控制台获取详细信息</div>`;
    }
}

// 显示例题
function displayExamples() {
    console.log('开始显示例题...');
    const examplesList = document.getElementById('examplesList');
    
    if (!examplesList) {
        console.error('找不到examplesList元素');
        return;
    }
    
    const currentFunctionType = functionSelect.value;
    console.log('当前函数类型:', currentFunctionType);
    console.log('当前过滤器:', currentFilter);
    console.log('例题数据:', examplesData);
    
    let examplesToShow = [];
    
    if (currentFilter === 'current') {
        // 显示当前函数类型的例题
        if (examplesData[currentFunctionType]) {
            examplesToShow = examplesData[currentFunctionType].map(example => ({
                ...example,
                type: currentFunctionType
            }));
            console.log('当前函数类型的例题数量:', examplesToShow.length);
        } else {
            console.log('当前函数类型没有例题:', currentFunctionType);
        }
    } else {
        // 显示所有例题
        for (const [type, examples] of Object.entries(examplesData)) {
            if (Array.isArray(examples)) {
                examplesToShow.push(...examples.map(example => ({
                    ...example,
                    type: type
                })));
            }
        }
        console.log('所有例题数量:', examplesToShow.length);
    }
    
    if (examplesToShow.length === 0) {
        examplesList.innerHTML = '<div class="loading-message">暂无相关例题</div>';
        return;
    }
    
    try {
        examplesList.innerHTML = examplesToShow.map((example, index) => `
            <div class="example-card" onclick="toggleExample(${index}, event)" id="example-${index}">
                <div class="example-title">${example.title || '无标题'}</div>
                <div class="example-description">${highlightFormulas(example.description || '无描述')}</div>
                <div class="example-details">
                    <h4 style="color: #8b5cf6; margin-bottom: 8px; font-size: 0.95rem;">📋 解题步骤：</h4>
                    <ul class="example-steps">
                        ${(example.steps || []).map(step => `<li>${highlightFormulas(step)}</li>`).join('')}
                    </ul>
                    <div class="example-solution">
                        <strong style="color: #00d4ff;">💡 答案：</strong>${highlightFormulas(example.solution || '无答案')}
                    </div>
                    <div class="example-knowledge">
                        <strong style="color: #8b5cf6;">📚 知识点：</strong>${highlightFormulas(example.knowledge || '无知识点')}
                    </div>
                </div>
            </div>
        `).join('');
        console.log('例题显示完成');
    } catch (error) {
        console.error('显示例题时出错:', error);
        examplesList.innerHTML = '<div class="loading-message">显示例题时出错，请检查控制台</div>';
    }
}

// 切换例题详情显示
function toggleExample(index, event) {
    // 如果点击的是公式，不展开卡片
    if (event && event.target.classList.contains('formula')) {
        return;
    }
    
    const card = document.getElementById(`example-${index}`);
    card.classList.toggle('expanded');
}

// 添加ESC键关闭公式弹窗
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeFormulaModal();
    }
});

// 设置例题过滤器
function setupExamplesFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // 设置默认激活状态
    filterButtons.forEach(btn => {
        if (btn.dataset.type === 'current') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有按钮的active类
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // 添加当前按钮的active类
            button.classList.add('active');
            
            // 更新过滤器状态
            currentFilter = button.dataset.type;
            
            // 重新显示例题
            displayExamples();
        });
    });
    
    // 添加公式弹窗的点击外部关闭功能
    window.addEventListener('click', (event) => {
        const formulaModal = document.getElementById('formulaModal');
        if (event.target === formulaModal) {
            closeFormulaModal();
        }
    });
}

// 获取函数类型的中文名称
function getFunctionTypeName(type) {
    const typeNames = {
        'linear': '一次函数',
        'quadratic': '二次函数',
        'power': '幂函数',
        'inverse': '反比例函数',
        'sqrt': '根式函数',
        'abs': '绝对值函数',
        'sin': '正弦函数',
        'cos': '余弦函数',
        'tan': '正切函数',
        'exp': '指数函数',
        'log': '对数函数',
        'piecewise': '分段函数'
    };
    return typeNames[type] || type;
}

// 公式/定理高亮功能
function highlightFormulas(text) {
    // 定义需要高亮的公式和定理关键词
    const formulas = {
        '韦达定理': {
            title: '韦达定理',
            content: `
                <div class="formula-definition">
                    <h4>定理内容：</h4>
                    <p>对于一元二次方程 ax² + bx + c = 0 (a ≠ 0)，如果方程有两个根 x₁ 和 x₂，则：</p>
                    <ul>
                        <li>x₁ + x₂ = -b/a （两根之和）</li>
                        <li>x₁ · x₂ = c/a （两根之积）</li>
                    </ul>
                </div>
                <div class="formula-example">
                    <h4>应用示例：</h4>
                    <p>对于方程 x² - 5x + 6 = 0，根据韦达定理：</p>
                    <p>x₁ + x₂ = 5，x₁ · x₂ = 6</p>
                    <p>可以快速判断两根为 2 和 3</p>
                </div>
            `
        },
        '顶点公式': {
            title: '二次函数顶点公式',
            content: `
                <div class="formula-definition">
                    <h4>公式内容：</h4>
                    <p>对于二次函数 f(x) = ax² + bx + c (a ≠ 0)：</p>
                    <ul>
                        <li>顶点横坐标：x = -b/(2a)</li>
                        <li>顶点纵坐标：y = f(-b/(2a)) = (4ac - b²)/(4a)</li>
                        <li>顶点坐标：(-b/(2a), (4ac - b²)/(4a))</li>
                    </ul>
                </div>
                <div class="formula-example">
                    <h4>应用示例：</h4>
                    <p>对于函数 f(x) = -2x² + 4x + 3：</p>
                    <p>顶点横坐标：x = -4/(-4) = 1</p>
                    <p>顶点纵坐标：y = f(1) = -2 + 4 + 3 = 5</p>
                    <p>所以顶点为 (1, 5)，这是函数的最大值点</p>
                </div>
            `
        },
        '判别式': {
            title: '一元二次方程判别式',
            content: `
                <div class="formula-definition">
                    <h4>公式内容：</h4>
                    <p>对于一元二次方程 ax² + bx + c = 0 (a ≠ 0)：</p>
                    <p>判别式 Δ = b² - 4ac</p>
                    <ul>
                        <li>Δ > 0：方程有两个不相等的实根</li>
                        <li>Δ = 0：方程有两个相等的实根</li>
                        <li>Δ < 0：方程无实根</li>
                    </ul>
                </div>
                <div class="formula-example">
                    <h4>应用示例：</h4>
                    <p>对于方程 x² - 4x + 4 = 0：</p>
                    <p>Δ = (-4)² - 4×1×4 = 16 - 16 = 0</p>
                    <p>所以方程有两个相等的实根 x = 2</p>
                </div>
            `
        },
        '配方法': {
            title: '配方法',
            content: `
                <div class="formula-definition">
                    <h4>方法步骤：</h4>
                    <p>将二次函数 f(x) = ax² + bx + c 配成完全平方式：</p>
                    <ol>
                        <li>提取二次项系数：f(x) = a(x² + (b/a)x) + c</li>
                        <li>配方：f(x) = a(x + b/(2a))² - b²/(4a) + c</li>
                        <li>化简：f(x) = a(x + b/(2a))² + (4ac - b²)/(4a)</li>
                    </ol>
                </div>
                <div class="formula-example">
                    <h4>应用示例：</h4>
                    <p>对于 f(x) = x² - 4x + 3：</p>
                    <p>f(x) = (x - 2)² - 4 + 3 = (x - 2)² - 1</p>
                    <p>顶点为 (2, -1)</p>
                </div>
            `
        },
        '反比例函数': {
            title: '反比例函数性质',
            content: `
                <div class="formula-definition">
                    <h4>函数形式：</h4>
                    <p>f(x) = k/x (k ≠ 0)</p>
                    <h4>主要性质：</h4>
                    <ul>
                        <li>定义域：x ≠ 0</li>
                        <li>值域：y ≠ 0</li>
                        <li>图像是双曲线</li>
                        <li>关于原点对称（奇函数）</li>
                        <li>k > 0时，在(-∞,0)和(0,+∞)上单调递减</li>
                        <li>k < 0时，在(-∞,0)和(0,+∞)上单调递增</li>
                    </ul>
                </div>
            `
        }
    };
    
    let result = text;
    for (const [keyword, data] of Object.entries(formulas)) {
        const regex = new RegExp(keyword, 'g');
        result = result.replace(regex, `<span class="formula" onclick="showFormulaModal('${keyword}')">${keyword}</span>`);
    }
    
    return result;
}

// 显示公式弹窗
function showFormulaModal(formulaKey) {
    const formulas = {
        '韦达定理': {
            title: '韦达定理',
            content: `
                <div class="formula-definition">
                    <h4>定理内容：</h4>
                    <p>对于一元二次方程 ax² + bx + c = 0 (a ≠ 0)，如果方程有两个根 x₁ 和 x₂，则：</p>
                    <ul>
                        <li>x₁ + x₂ = -b/a （两根之和）</li>
                        <li>x₁ · x₂ = c/a （两根之积）</li>
                    </ul>
                </div>
                <div class="formula-example">
                    <h4>应用示例：</h4>
                    <p>对于方程 x² - 5x + 6 = 0，根据韦达定理：</p>
                    <p>x₁ + x₂ = 5，x₁ · x₂ = 6</p>
                    <p>可以快速判断两根为 2 和 3</p>
                </div>
            `
        },
        '顶点公式': {
            title: '二次函数顶点公式',
            content: `
                <div class="formula-definition">
                    <h4>公式内容：</h4>
                    <p>对于二次函数 f(x) = ax² + bx + c (a ≠ 0)：</p>
                    <ul>
                        <li>顶点横坐标：x = -b/(2a)</li>
                        <li>顶点纵坐标：y = f(-b/(2a)) = (4ac - b²)/(4a)</li>
                        <li>顶点坐标：(-b/(2a), (4ac - b²)/(4a))</li>
                    </ul>
                </div>
                <div class="formula-example">
                    <h4>应用示例：</h4>
                    <p>对于函数 f(x) = -2x² + 4x + 3：</p>
                    <p>顶点横坐标：x = -4/(-4) = 1</p>
                    <p>顶点纵坐标：y = f(1) = -2 + 4 + 3 = 5</p>
                    <p>所以顶点为 (1, 5)，这是函数的最大值点</p>
                </div>
            `
        },
        '判别式': {
            title: '一元二次方程判别式',
            content: `
                <div class="formula-definition">
                    <h4>公式内容：</h4>
                    <p>对于一元二次方程 ax² + bx + c = 0 (a ≠ 0)：</p>
                    <p>判别式 Δ = b² - 4ac</p>
                    <ul>
                        <li>Δ > 0：方程有两个不相等的实根</li>
                        <li>Δ = 0：方程有两个相等的实根</li>
                        <li>Δ < 0：方程无实根</li>
                    </ul>
                </div>
                <div class="formula-example">
                    <h4>应用示例：</h4>
                    <p>对于方程 x² - 4x + 4 = 0：</p>
                    <p>Δ = (-4)² - 4×1×4 = 16 - 16 = 0</p>
                    <p>所以方程有两个相等的实根 x = 2</p>
                </div>
            `
        },
        '配方法': {
            title: '配方法',
            content: `
                <div class="formula-definition">
                    <h4>方法步骤：</h4>
                    <p>将二次函数 f(x) = ax² + bx + c 配成完全平方式：</p>
                    <ol>
                        <li>提取二次项系数：f(x) = a(x² + (b/a)x) + c</li>
                        <li>配方：f(x) = a(x + b/(2a))² - b²/(4a) + c</li>
                        <li>化简：f(x) = a(x + b/(2a))² + (4ac - b²)/(4a)</li>
                    </ol>
                </div>
                <div class="formula-example">
                    <h4>应用示例：</h4>
                    <p>对于 f(x) = x² - 4x + 3：</p>
                    <p>f(x) = (x - 2)² - 4 + 3 = (x - 2)² - 1</p>
                    <p>顶点为 (2, -1)</p>
                </div>
            `
        },
        '反比例函数': {
            title: '反比例函数性质',
            content: `
                <div class="formula-definition">
                    <h4>函数形式：</h4>
                    <p>f(x) = k/x (k ≠ 0)</p>
                    <h4>主要性质：</h4>
                    <ul>
                        <li>定义域：x ≠ 0</li>
                        <li>值域：y ≠ 0</li>
                        <li>图像是双曲线</li>
                        <li>关于原点对称（奇函数）</li>
                        <li>k > 0时，在(-∞,0)和(0,+∞)上单调递减</li>
                        <li>k < 0时，在(-∞,0)和(0,+∞)上单调递增</li>
                    </ul>
                </div>
            `
        }
    };
    
    const formula = formulas[formulaKey];
    if (formula) {
        document.getElementById('formulaTitle').textContent = formula.title;
        document.getElementById('formulaContent').innerHTML = formula.content;
        document.getElementById('formulaModal').style.display = 'block';
    }
}

// 关闭公式弹窗
function closeFormulaModal() {
    document.getElementById('formulaModal').style.display = 'none';
}

// 当函数类型改变时更新例题显示
function onFunctionTypeChange() {
    if (currentFilter === 'current') {
        displayExamples();
    }
}

// 修改原有的函数选择事件监听器
const originalFunctionSelectListener = functionSelect.onchange;
functionSelect.onchange = function() {
    if (originalFunctionSelectListener) {
        originalFunctionSelectListener.call(this);
    }
    onFunctionTypeChange();
};

// 启动应用
createSliders();
updateExpression();
drawPlot();
addInteractiveExercises();
resizeCanvas();

// 初始化例题功能
loadExamples();
setupExamplesFilter();