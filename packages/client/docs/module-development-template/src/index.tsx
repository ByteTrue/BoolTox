import { useState } from 'react';

/**
 * 示例模块 - 简单计算器
 * 
 * 这是一个完整的 Booltox 模块示例
 * 展示了如何创建一个可以被动态加载的 React 组件
 */
export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [operation, setOperation] = useState<string | null>(null);
  const [previousValue, setPreviousValue] = useState<number | null>(null);

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

  return (
    <div style={{
      maxWidth: '320px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      backdropFilter: 'blur(10px)',
    }}>
      {/* 显示屏 */}
      <div style={{
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
      }}>
        {display}
      </div>

      {/* 按钮网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
      }}>
        {[
          ['7', '8', '9', '÷'],
          ['4', '5', '6', '×'],
          ['1', '2', '3', '-'],
          ['C', '0', '=', '+']
        ].flat().map((btn, i) => (
          <button
            key={i}
            onClick={() => {
              if (btn === 'C') handleClear();
              else if (btn === '=') handleEquals();
              else if (['+', '-', '×', '÷'].includes(btn)) handleOperation(btn);
              else handleNumber(btn);
            }}
            style={{
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
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}
