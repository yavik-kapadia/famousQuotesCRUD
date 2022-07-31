

//event listeners
let authorLinks = document.querySelectorAll("a");

for (authorLink of authorLinks){
    authorLink.addEventListener("click", getAuthorInfo);
}

async function getAuthorInfo(){
    var myModal = new bootstrap.Modal(document.getElementById("authorModal"));
    myModal.show();
    let url = `/api/author/${this.id}`;
    let response = await fetch(url);
    let data = await response.json();
    console.log(data);
    let authorInfo = document.querySelector("#authorInfo");
    authorInfo.innerHTML = `<h1>${data[0].firstName} ${data[0].lastName}</h1>`;
    authorInfo.innerHTML += `<img src="${data[0].portrait}" width="200" alt="image of author"><br>`;
    authorInfo.innerHTML += `<p>Gender: ${data[0].sex}</p>`;
    authorInfo.innerHTML += `<p>Born: ${data[0].dob}</p>`;
    authorInfo.innerHTML += `<p>Died: ${data[0].dod}</p>`;
    authorInfo.innerHTML += `<p>Citizenship: ${data[0].country}</p>`;
    authorInfo.innerHTML += `<p>Profession: ${data[0].profession}</p>`;
    authorInfo.innerHTML += `<h5>Biography:</h5>`;
    authorInfo.innerHTML += `<p>${data[0].biography}</p><br>`;
    
}
