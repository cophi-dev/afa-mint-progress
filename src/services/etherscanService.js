const ETHERSCAN_API_KEY = process.env.REACT_APP_ETHERSCAN_API_KEY;
const CONTRACT_ADDRESS = '0xfAa0e99EF34Eae8b288CFEeAEa4BF4f5B5f2eaE7';

export const getAllTransactions = async () => {
  try {
    const response = await fetch(
      `https://api.etherscan.io/api?module=account&action=tokennfttx&contractaddress=${CONTRACT_ADDRESS}&page=1&offset=10000&startblock=0&endblock=999999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    );
    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

export const processNFTStatuses = (transactions) => {
  const nftStatuses = new Map();
  
  transactions.forEach(tx => {
    const tokenId = parseInt(tx.tokenID);
    nftStatuses.set(tokenId, {
      owner: tx.to,
      timestamp: tx.timeStamp
    });
  });
  
  return nftStatuses;
};