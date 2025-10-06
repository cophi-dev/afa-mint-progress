const ETHERSCAN_API_KEY = process.env.REACT_APP_ETHERSCAN_API_KEY;
const CONTRACT_ADDRESS = '0xfAa0e99EF34Eae8b288CFEeAEa4BF4f5B5f2eaE7';

export const getAllTransactions = async () => {
  try {
    const url = `https://api.etherscan.io/v2/api?module=account&action=tokennfttx&contractaddress=${CONTRACT_ADDRESS}&page=1&offset=10000&startblock=0&endblock=999999999&sort=asc&chainid=1&apikey=${ETHERSCAN_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '0') {
      throw new Error(data.message || 'Etherscan API error');
    }
    
    return data.result || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

export const processNFTStatuses = (transactions) => {
  if (!Array.isArray(transactions)) {
    console.error('Transactions is not an array:', transactions);
    return new Map();
  }
  
  const nftStatuses = new Map();
  
  transactions.forEach(tx => {
    if (tx && tx.tokenID) {
      const tokenId = parseInt(tx.tokenID);
      nftStatuses.set(tokenId, {
        owner: tx.to,
        timestamp: tx.timeStamp
      });
    }
  });
  
  return nftStatuses;
};
