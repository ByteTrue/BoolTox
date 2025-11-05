/**
 * 远程模块示例 - 计算器
 * 
 * 这是一个独立的 React 组件，可以被 Booltox 动态加载
 * 打包后上传到 CDN/GitHub，通过 manifest.json 提供给用户安装
 */

// 注意: 在实际打包时，React 会由宿主应用提供
// 这里只是为了开发时的类型检查
declare const React: any;

function Calculator() {
  const [display, setDisplay] = React.useState('0');
  const [operation, setOperation] = React.useState<string | null>(null);
  const [previousValue, setPreviousValue] = React.useState<number | null>(null);

  const handleNumber = (num: string) => {
    setDisplay(display === '0' ? num : display + num);
  };

  const handleOperation = (op: string) => {
    setPreviousValue(parseFloat(display));
    setOperation(op);
    setDisplay('0');
  };

  const handleEquals = () => {
    if (previousValue === null || operation === null) return;

    const current = parseFloat(display);
    let result = 0;

    switch (operation) {
      case '+':
        result = previousValue + current;
        break;
      case '-':
        result = previousValue - current;
        break;
      case '×':
        result = previousValue * current;
        break;
      case '÷':
        result = previousValue / current;
        break;
    }

    setDisplay(String(result));
    setPreviousValue(null);
    setOperation(null);
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
  };

  return React.createElement(
    'div',
    {
      style: {
        maxWidth: '320px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        backdropFilter: 'blur(10px)',
      }
    },
    [
      // 显示屏
      React.createElement(
        'div',
        {
          key: 'display',
          style: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'right',
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '16px',
            minHeight: '60px',
            wordBreak: 'break-all',
          }
        },
        display
      ),
      // 按钮网格
      React.createElement(
        'div',
        {
          key: 'buttons',
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
          }
        },
        [
          ['7', '8', '9', '÷'],
          ['4', '5', '6', '×'],
          ['1', '2', '3', '-'],
          ['C', '0', '=', '+']
        ].flat().map((btn, i) =>
          React.createElement(
            'button',
            {
              key: i,
              onClick: () => {
                if (btn === 'C') handleClear();
                else if (btn === '=') handleEquals();
                else if (['+', '-', '×', '÷'].includes(btn)) handleOperation(btn);
                else handleNumber(btn);
              },
              style: {
                padding: '16px',
                fontSize: '20px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: ['+', '-', '×', '÷', '='].includes(btn)
                  ? 'rgba(66, 153, 225, 0.8)'
                  : btn === 'C'
                  ? 'rgba(245, 101, 101, 0.8)'
                  : 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                gridColumn: btn === '0' ? 'span 2' : 'span 1',
              },
              onMouseEnter: (e: any) => {
                e.target.style.transform = 'scale(1.05)';
              },
              onMouseLeave: (e: any) => {
                e.target.style.transform = 'scale(1)';
              }
            },
            btn
          )
        )
      )
    ]
  );
}

// 导出为默认模块
// 在打包时会被转换为 UMD/IIFE 格式
export default Calculator;

// 如果是在浏览器环境直接运行(用于测试)
if (typeof window !== 'undefined' && !module) {
  (window as any).Calculator = Calculator;
}
