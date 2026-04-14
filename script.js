const CONNECTION_TOKEN = "90935282|-31949236191687444|90958080";
const DB_NAME = "SCHOOL-DB";
const REL_NAME = "STUDENT-TABLE";
const BASE_URL = "http://api.login2explore.com:5577";
const IML_ENDPOINT = "/api/iml";
const IRL_ENDPOINT = "/api/irl";

const rollNoInput = document.getElementById("rollNo");
const fullNameInput = document.getElementById("fullName");
const stuClassInput = document.getElementById("stuClass");
const birthDateInput = document.getElementById("birthDate");
const addressInput = document.getElementById("address");
const enrollmentDateInput = document.getElementById("enrollmentDate");

const saveBtn = document.getElementById("saveBtn");
const updateBtn = document.getElementById("updateBtn");
const resetBtn = document.getElementById("resetBtn");

let currentRecordNo = "";

window.onload = () => {
    resetForm();
};

function showToast(message, type = 'info') {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    let icon = '';
    if (type === 'success') icon = '✓';
    else if (type === 'error') icon = '⚠';
    else icon = 'ℹ';

    toast.innerHTML = `<strong>${icon}</strong> <span>${message}</span>`;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        setTimeout(() => toast.classList.add("show"), 10);
    });

    setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.add("hide");
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 400);
    }, 3500);
}

function resetForm() {
    rollNoInput.value = "";
    fullNameInput.value = "";
    stuClassInput.value = "";
    birthDateInput.value = "";
    addressInput.value = "";
    enrollmentDateInput.value = "";

    currentRecordNo = "";

    rollNoInput.disabled = false;
    fullNameInput.disabled = true;
    stuClassInput.disabled = true;
    birthDateInput.disabled = true;
    addressInput.disabled = true;
    enrollmentDateInput.disabled = true;

    saveBtn.disabled = true;
    updateBtn.disabled = true;
    resetBtn.disabled = true;

    rollNoInput.focus();
}

async function checkRollNo() {
    const rollNo = rollNoInput.value.trim();
    if (!rollNo) return;

    const getReqStr = createGETRequest(CONNECTION_TOKEN, DB_NAME, REL_NAME, JSON.stringify({ Roll_No: rollNo }));

    try {
        const response = await executeCommandAtGivenBaseUrl(getReqStr, BASE_URL, IRL_ENDPOINT);

        if (response.status === 400) {
            enableFieldsForNew();
            fullNameInput.focus();
            showToast("New Roll Number! Enter details below.", 'info');
        } else if (response.status === 200) {
            const resData = JSON.parse(response.data);
            currentRecordNo = resData.rec_no;
            fillData(resData.record);
            enableFieldsForUpdate();
            fullNameInput.focus();
            showToast("Record found! You can now update.", 'success');
        }
    } catch (error) {
        console.error("Error checking Record:", error);
        showToast("Error mapping response from JSONPowerDB!", 'error');
    }
}

function enableFieldsForNew() {
    rollNoInput.disabled = true;
    fullNameInput.disabled = false;
    stuClassInput.disabled = false;
    birthDateInput.disabled = false;
    addressInput.disabled = false;
    enrollmentDateInput.disabled = false;

    saveBtn.disabled = false;
    updateBtn.disabled = true;
    resetBtn.disabled = false;
}

function enableFieldsForUpdate() {
    rollNoInput.disabled = true;
    fullNameInput.disabled = false;
    stuClassInput.disabled = false;
    birthDateInput.disabled = false;
    addressInput.disabled = false;
    enrollmentDateInput.disabled = false;

    saveBtn.disabled = true;
    updateBtn.disabled = false;
    resetBtn.disabled = false;
}

function fillData(record) {
    fullNameInput.value = record.FullName;
    stuClassInput.value = record.Class;
    birthDateInput.value = record.BirthDate;
    addressInput.value = record.Address;
    enrollmentDateInput.value = record.EnrollmentDate;
}

function validateData() {
    const rollNo = rollNoInput.value.trim();
    const fullName = fullNameInput.value.trim();
    const stuClass = stuClassInput.value.trim();
    const birthDate = birthDateInput.value;
    const address = addressInput.value.trim();
    const enrollmentDate = enrollmentDateInput.value;

    if (!rollNo || !fullName || !stuClass || !birthDate || !address || !enrollmentDate) {
        showToast("All fields are required! Please fill out the entire form.", 'error');
        return null;
    }

    const dataObj = {
        Roll_No: rollNo,
        FullName: fullName,
        Class: stuClass,
        BirthDate: birthDate,
        Address: address,
        EnrollmentDate: enrollmentDate
    };

    return JSON.stringify(dataObj);
}

async function saveData() {
    const jsonStr = validateData();
    if (!jsonStr) return;

    const putReqStr = createPUTRequest(CONNECTION_TOKEN, jsonStr, DB_NAME, REL_NAME);

    try {
        const response = await executeCommandAtGivenBaseUrl(putReqStr, BASE_URL, IML_ENDPOINT);
        if (response.status === 200) {
            showToast("Record Saved Successfully!", 'success');
            resetForm();
        } else {
            showToast("Error saving record: " + response.message, 'error');
        }
    } catch (error) {
        console.error("Save Error:", error);
        showToast("Failed to communicate with DB.", 'error');
    }
}

async function updateData() {
    const jsonStr = validateData();
    if (!jsonStr) return;

    const updateReqStr = createUPDATERecordRequest(CONNECTION_TOKEN, jsonStr, DB_NAME, REL_NAME, currentRecordNo);

    try {
        const response = await executeCommandAtGivenBaseUrl(updateReqStr, BASE_URL, IML_ENDPOINT);
        if (response.status === 200) {
            showToast("Record Updated Successfully!", 'success');
            resetForm();
        } else {
            showToast("Error updating record: " + response.message, 'error');
        }
    } catch (error) {
        console.error("Update Error:", error);
        showToast("Failed to communicate with DB.", 'error');
    }
}

function createGETRequest(token, dbName, relName, jsonObjStr) {
    return "{\n"
        + "\"token\" : \"" + token + "\",\n"
        + "\"cmd\" : \"GET_BY_KEY\",\n"
        + "\"dbName\": \"" + dbName + "\",\n"
        + "\"rel\" : \"" + relName + "\",\n"
        + "\"createTime\": true,\n"
        + "\"updateTime\": true,\n"
        + "\"jsonStr\": \n" + jsonObjStr + "\n"
        + "}";
}

function createPUTRequest(connToken, jsonObj, dbName, relName) {
    return "{\n"
        + "\"token\" : \"" + connToken + "\",\n"
        + "\"dbName\": \"" + dbName + "\",\n"
        + "\"cmd\" : \"PUT\",\n"
        + "\"rel\" : \"" + relName + "\",\n"
        + "\"jsonStr\": \n" + jsonObj + "\n"
        + "}";
}

function createUPDATERecordRequest(token, jsonObjStr, dbName, relName, reqId) {
    return "{\n"
        + "\"token\" : \"" + token + "\",\n"
        + "\"cmd\" : \"UPDATE\",\n"
        + "\"dbName\": \"" + dbName + "\",\n"
        + "\"rel\" : \"" + relName + "\",\n"
        + "\"jsonStr\": { \"" + reqId + "\": " + jsonObjStr + "}\n"
        + "}";
}

async function executeCommandAtGivenBaseUrl(reqString, dbBaseUrl, apiEndPointUrl) {
    const url = dbBaseUrl + apiEndPointUrl;
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: reqString,
            headers: {
                'Content-Type': 'text/plain'
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
}
