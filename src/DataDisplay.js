import React from 'react';

const DataDisplay = ({ data, showPopup, setShowPopup }) => {
    if (!data) return null;

    return (
        <>
            <button className="btn" onClick={() => setShowPopup(true)}>Review Uploaded CSV - Cleaned & Tuned</button>
            {showPopup && (
                <div className="popup">
                    <div className="popup-content">
                        <button className="close-btn" onClick={() => setShowPopup(false)}>X</button>
                        <h2>Uploaded CSV Data</h2>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {data[0] && Object.keys(data[0]).map((key, index) => (
                                        <th key={index}>{key}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, index) => (
                                    <tr key={index}>
                                        {Object.values(row).map((value, cellIndex) => (
                                            <td key={cellIndex}>{value}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
};

export default DataDisplay;
