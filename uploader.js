const chokidar = require('chokidar');
const clipboardy = require('clipboardy');
const axios = require('axios');
const crypto = require('crypto')
const fs = require("fs");
const FormData = require('form-data');
const opn = require("opn");
const sizeOf = require("image-size");

const PATH_BASE = "C:\\Users\\user\\Pictures\\Screenshots";
const API_KEY="b3cb18c5-131c-4ce0-b0c4-7a02fa098b31";
const EMAIL = "user@password";
const USERNAME = "user";
const PASSWORD = "password";

var watcher = chokidar.watch(PATH_BASE, {ignored: /^\./, persistent: true, ignoreInitial: true});

watcher
  .on('add', watchAdded)
  .on('change', function(path) {console.log('File', path, 'has been changed');})
  .on('unlink', function(path) {console.log('File', path, 'has been removed');})
  .on('error', function(error) {console.error('Error happened', error);})


/**
 * @param
 * @return
 */
async function watchAdded(path) {
  console.log('File', path, 'has been added');
  url = await upploadFile(path);
  clipboardy.writeSync(url);
  opn(url);
}

/**
 * @param
 * @return string
 */
function calcCallSignature(params) {
  //console.log(params);
  let callSignature = calcSecretKey();
  //console.log(callSignature)
  let keys = Object.keys(params);
  keys = keys.sort();
  // console.log(keys)
  for (let k of keys) {
    // console.log(params[k]);
    callSignature += k;
    callSignature += encodeURIComponent(params[k]);
  }
  //console.log(callSignature);
  return toSha1String(callSignature);
}

/**
 * @param
 * @return string
 */
function toSha1String(str)
{
  shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex');
}

/**
 * @return string
 */
function calcSecretKey() {
	let str1 = "59b5ef3d";
	let str2 = "-724f-4643-9900-d";
	let num = 1 << parseInt(str1[6]);
	let str3 = "34cc1fe7";
	return str1 + str2 + num + num + str3 + num;
}

/**
 * @return string
 */
async function getAuthCode() {
  let parameters = {
    method: "Screencast.Auth.GetCode",
    userName: USERNAME,
    hashedPassword: toSha1String(toSha1String(PASSWORD) + calcSecretKey()),
    apiKey: API_KEY
  };
  parameters.callSignature = calcCallSignature(parameters);
  console.log(parameters)
  let authCode = null;
 
  let response = await axios.get('http://www.screencast.com/api/', {
    params: parameters
  })
  .then(function (response) {
    // console.log(response.data);
    return response.data;
  })
  .catch(function (error) {
    console.log(error);
  });

  // console.log(response);
  let arr = /<authCode>(.*?)<\/authCode>/.exec(response)
  // console.log(arr);
  authCode = arr[1];
  // console.log(authCode);

  return authCode;  
}

/**
 * @param
 * @return string
 */
async function getUserId(authCode) {
  let parameters = {
    method: "Screencast.User.GetInfo",
    emailAddress: EMAIL,
    authCode: authCode,
    apiKey: API_KEY
  };
  let callSignature = calcCallSignature(parameters);
  parameters.callSignature = calcCallSignature(parameters);
  console.log(parameters)
  let userId = null;

  let response = await axios.get('http://www.screencast.com/api/', {
    params: parameters
  })
  .then(function (response) {
    // console.log(response.data);
    return response.data;
  })
  .catch(function (error) {
    console.log(error);
  });

  let arr = /<userId>(.*?)<\/userId>/.exec(response)
  userId = arr[1];

  return userId;
}

/**
 * @param
 * @return string
 */
async function getMediaGroupId(userId, authCode) {
  let parameters = {
    method: "Screencast.MediaGroup.FindByUserAndTitle",
    userId: userId,
    title: "Jing",
    authCode: authCode,
    apiKey: API_KEY
  };
  parameters.callSignature = calcCallSignature(parameters);
  console.log(parameters)
  let mediaGroupId = null;
 
  let response = await axios.get('http://www.screencast.com/api/', {
    params: parameters
  })
  .then(function (response) {
    // console.log(response.data);
    return response.data;
  })
  .catch(function (error) {
    console.log(error);
  });

  // console.log(response);
  let arr = /<mediaGroupId>(.*?)<\/mediaGroupId>/.exec(response)
  // console.log(arr);
  mediaGroupId = arr[1];
  // console.log(authCode);

  return mediaGroupId;
}

/**
 * @param
 * @return string
 */
async function getMediaSetId(title, authCode) {
  let parameters = {
    method: "Screencast.MediaSet.Create",
    title: title,
    authCode: authCode,
    apiKey: API_KEY
  };
  parameters.callSignature = calcCallSignature(parameters);
  console.log(parameters)
  let mediaSetId = null;
 
  let response = await axios.get('http://www.screencast.com/api/', {
    params: parameters
  })
  .then(function (response) {
    // console.log(response.data);
    return response.data;
  })
  .catch(function (error) {
    console.log(error);
  });

  // console.log(response);
  let arr = /<mediaSetId>(.*?)<\/mediaSetId>/.exec(response)
  // console.log(arr);
  mediaSetId = arr[1];
  // console.log(authCode);

  return mediaSetId;
}

/**
 * @param
 * @return string
 */
async function addMediaSet(mediaGroupId, mediaSetId, authCode) {
  let parameters = {
    method: "Screencast.MediaGroup.AddMediaSet",
    mediaGroupId: mediaGroupId,
    mediaSetId: mediaSetId,
    authCode: authCode,
    apiKey: API_KEY
  };
  parameters.callSignature = calcCallSignature(parameters);
  console.log(parameters)
  let status = null;
 
  let response = await axios.get('http://www.screencast.com/api/', {
    params: parameters
  })
  .then(function (response) {
    // console.log(response.data);
    return response.data;
  })
  .catch(function (error) {
    console.log(error);
  });

  // console.log(response);
  let arr = /<status>(.*?)<\/status>/.exec(response)
  // console.log(arr);
  status = arr[1];
  // console.log(authCode);

  return status;
}

/**
 * @param
 * @return string
 */
async function getMediaId(dataLength, fileName, dimensions, mediaSetId, authCode) {
  let parameters = {
    method: "Screencast.Upload.BeginUpload",
    dataLength: dataLength,
    fileName: fileName,
    isAttachment: false,
    width: dimensions.width,
    height: dimensions.height,
    mediaSetId: mediaSetId,
    authCode: authCode,
    apiKey: API_KEY
  };
  parameters.callSignature = calcCallSignature(parameters);
  console.log(parameters)
  let mediaId = null;
 
  let response = await axios.get('http://www.screencast.com/api/', {
    params: parameters
  })
  .then(function (response) {
    // console.log(response.data);
    return response.data;
  })
  .catch(function (error) {
    console.log(error);
  });

  // console.log(response);
  let arr = /<mediaId>(.*?)<\/mediaId>/.exec(response)
  // console.log(arr);
  mediaId = arr[1];
  // console.log(authCode);

  return mediaId;
}

/**
 * @param
 * @return string
 */
async function postUpload(dataLength, path, mediaId, authCode) {
  let parameters = {
    method: "Screencast.Upload.AppendData",
    dataLength: dataLength,
    mediaId: mediaId,
    offset: 0,
    authCode: authCode,
    apiKey: API_KEY
  };
  parameters.callSignature = calcCallSignature(parameters);
  console.log(parameters)
  let bytesReceived = null;

  let form = new FormData();
  form.append("method", "Screencast.Upload.AppendData");
  form.append("mediaId", mediaId);
  form.append("dataLength", dataLength);
  form.append("offset", 0);
  form.append("apiKey", API_KEY);
  form.append("authCode", authCode);
  form.append("callSignature", parameters.callSignature);
  form.append("fileData", fs.createReadStream(path));
  
  let response = await axios.post('http://www.screencast.com/api/', form, {
    headers: form.getHeaders(),
  })
  .then(function (response) {
    console.log(response.data);
    return response.data;
  })
  .catch(function (error) {
    console.log(error);
  });

  // console.log(response);
  let arr = /<bytesReceived>(.*?)<\/bytesReceived>/.exec(response)
  // console.log(arr);
  bytesReceived = arr[1];
  // console.log(authCode);

  return bytesReceived;
}

/**
 * @param
 * @return string
 */
async function getUrl(mediaGroupId, mediaSetId, authCode) {
  let parameters = {
    method: "Screencast.MediaSet.GetUrl",
    mediaGroupId: mediaGroupId,
    mediaSetId: mediaSetId,
    authCode: authCode,
    apiKey: API_KEY
  };
  parameters.callSignature = calcCallSignature(parameters);
  console.log(parameters)
  let url = null;
 
  let response = await axios.get('http://www.screencast.com/api/', {
    params: parameters
  })
  .then(function (response) {
    // console.log(response.data);
    return response.data;
  })
  .catch(function (error) {
    console.log(error);
  });

  // console.log(response);
  let arr = /<url>(.*?)<\/url>/.exec(response)
  // console.log(arr);
  url = arr[1];
  // console.log(authCode);

  return url;
}

/**
 * @param
 * @return string
 */
async function setDefaultMedia(mediaSetId, mediaId, fileName, dimensions, authCode) {
  let parameters = {
    method: "Screencast.MediaSet.SetDefaultMedia",
    mediaId: mediaId,
    mediaSetId: mediaSetId,
    fileName: fileName,
    width: dimensions.width,
    height: dimensions.height,
    offset: 0,
    authCode: authCode,
    apiKey: API_KEY
  };
  parameters.callSignature = calcCallSignature(parameters);
  console.log(parameters)
  let status = null;

  let response = await axios.get('http://www.screencast.com/api/', {
    params: parameters
  })
  .then(function (response) {
    console.log(response.data);
    return response.data;
  })
  .catch(function (error) {
    console.log(error);
  });

  // console.log(response);
  let arr = /<update>(.*?)<\/update>/.exec(response)
  // console.log(arr);
  status = arr[1];
  // console.log(authCode);

  return status;
}

/**
 * @param
 * @return string
 */
async function upploadFile(path) {
  let authCode = await getAuthCode();
  console.log("authCode = " + authCode);
  if (authCode === null) {
    throw new Error("cannot get authCode");
  }

  let userId = await getUserId(authCode);
  console.log("userId = " + userId);
  if (userId === null) {
    throw new Error("cannot get userId");
  }

  let mediaGroupId = await getMediaGroupId(userId, authCode);
  console.log("mediaGroupId = " + mediaGroupId);
  if (mediaGroupId === null) {
    throw new Error("cannot get mediaGroupId");
  }

  let filename = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  let mediaSetId = await getMediaSetId(filename, authCode);
  console.log("mediaSetId = " + mediaSetId);
  if (mediaSetId === null) {
    throw new Error("cannot get mediaSetId");
  }

  let status = await addMediaSet(mediaGroupId, mediaSetId, authCode);
  console.log("status = " + status);
  if (status === null) {
    throw new Error("cannot get status");
  }

  let stats = fs.statSync(path);
  let fileSizeInBytes = stats.size;
  
  let mediaId = await getMediaId(fileSizeInBytes, filename + ".png", sizeOf(path), mediaSetId, authCode);
  console.log("mediaId = " + mediaId);
  if (mediaId === null) {
    throw new Error("cannot get mediaId");
  }

  let bytesReceived = await postUpload(fileSizeInBytes, path, mediaId, authCode);
  console.log("bytesReceived = " + bytesReceived);
  if (bytesReceived === null) {
    throw new Error("cannot get bytesReceived");
  }

  let url = await getUrl(mediaGroupId, mediaSetId, authCode);
  console.log("url = " + url);
  if (url === null) {
    throw new Error("cannot get url");
  }
  
  status = await setDefaultMedia(mediaSetId, mediaId, filename + ".png", sizeOf(path), authCode);
  console.log("status = " + status);
  if (status === null) {
    throw new Error("cannot get status");
  }

  return url;
}

/**
 * @param
 * @return
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 
 */
async function justWait() {
  console.log('Taking a break...');
  await sleep(2000);
}

/**
 * 
 */
async function getIp() {
  try {
    const response = await axios.get('http://ipinfo.io/json');
    console.log(response.data.ip);
  } catch (error) {
    console.error(error);
  }
}
