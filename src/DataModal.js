import React from 'react';
// import './DataModal.css';

const DataModal = ({ show, handleClose, children }) => {
    return (
        <div className={`modal ${show ? 'show' : ''}`}>
            <div className="modal-content">
                <span className="close" onClick={handleClose}>&times;</span>
                {children}
            </div>
        </div>
    );
};

export default DataModal;