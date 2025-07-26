/*
Custom Data Structure:
- First 2 bytes: Size of the real data in bytes (big-endian)
- Next N bytes: The actual data
- Remaining bytes: Additional metadata as a UTF-8 string (possibly in JSON format)
*/

export function extractData(dataBuffer: Buffer, firstSize = 2) {
	const dataSize = dataBuffer.subarray(0, firstSize).readUInt16BE();
	const data = dataBuffer.subarray(firstSize, firstSize + dataSize);
	const metadata = dataBuffer.subarray(firstSize + dataSize).toString("utf8");

	return {
		data,
		metadata,
		dataSize,
	};
}

export function createDataBuffer(data: Buffer, metadata: string) {
	const metadataBuffer = Buffer.from(metadata, "utf8");
	const dataSize = Buffer.alloc(2);
	dataSize.writeUInt16BE(data.length);
	return Buffer.concat([dataSize, data, metadataBuffer]);
}
