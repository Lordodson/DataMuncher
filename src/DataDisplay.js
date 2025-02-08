import React from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

function PopupTable({ data }) {
  const Row = ({ index, style }) => (
    <div className="data-table-row" style={style}>
      {Object.values(data[index]).map((value, cellIndex) => (
        <div key={cellIndex} className="data-table-cell">
          {value}
        </div>
      ))}
    </div>
  );

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          width={width}
          itemSize={35} 
          itemCount={data.length}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
}

function DataDisplay({ data, showPopup, setShowPopup }) {
    return (
        <>
            {data && (
                <>
                    <button className="btn" onClick={() => setShowPopup(true)}>Review Uploaded CSV - Cleaned & Tuned</button>
                    {showPopup && (
                        <div className="popup">
                            <div className="popup-content">
                                <button className="close-btn" onClick={() => setShowPopup(false)}>X</button>
                                <h2>Uploaded CSV Data</h2>
                                <div className="data-table"> 
                                    <PopupTable data={data} />
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
}

export default DataDisplay;