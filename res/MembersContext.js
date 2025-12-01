// Create a MembersContext.js
import React, { createContext, useState, useContext } from 'react';

const MembersContext = createContext();

export const MembersProvider = ({ children }) => {
    const [members, setMembers] = useState([]);
    const [needsRefresh, setNeedsRefresh] = useState(false);

    return (
        <MembersContext.Provider value={{
            members,
            setMembers,
            needsRefresh,
            setNeedsRefresh
        }}>
            {children}
        </MembersContext.Provider>
    );
};

export const useMembers = () => useContext(MembersContext);