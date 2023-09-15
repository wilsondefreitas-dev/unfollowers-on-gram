const puppeteer = require('puppeteer');
const readlineSync = require('readline-sync');

const DELAY = 2500;
const USERNAME = readlineSync.question('Gram username: ') || '';
const PASSWORD = readlineSync.question('Gram password: ') || '';

(async () => {

  console.log('Process started, it can take some minutes...');

  const browser = await puppeteer.launch({headless: 'old'});
  const page = await browser.newPage();

  try{
  
    console.log('Loggin in...');
    await login(page);

  }catch(e){

    console.log(e.message);
    process.exit();

  }
  
  console.log('Getting followers...');
  const followers = await getUsers(page, 'followers');
  console.log(`Followers list completed! You have ${followers.length} followers!`);

  console.log('Getting users following you...');
  const following = await getUsers(page, 'following');
  console.log(`Users following you list completed! You have ${following.length} users following you!`);

  console.log('Checking who is not following you back...');
  const notFollowingBack = getNotFollowingBack(followers, following);
  console.log(`You have ${notFollowingBack.length} users not following you back. Here is their names:`);
  
  printUserNotFollowingBack(notFollowingBack);

  console.log('Process finished.')

  await browser.close();
  
})();

async function login(page){

  await page.goto('https://www.instagram.com/');

  await page.waitForSelector('form');
  
  await page.type('form input[name=username]', USERNAME);
  await page.type('form input[name=password]', PASSWORD);
  await page.click('form button[type=submit]');

  return new Promise(async (resolve, reject) => {

    page.waitForSelector('._ab2z')
      .then(async () => reject(
        {message: 'Something went wrong. Check you username and password.'}
      ));

    await page.waitForSelector('._aa56');

    resolve();

  });

}

async function getUsers(page, type){

  await page.goto(`https://www.instagram.com/${USERNAME}/${type}/?next=%2F`);
  
  await page.waitForSelector('._aano'); //pop up

  await showAllUsersOnPopup(page);

  return await getUsersNames(page);

}

async function showAllUsersOnPopup(page){

  let finished = false;

  while(!finished){ 
    
    const scrollHeight = await page.evaluate(() => document.querySelector('._aano').scrollHeight);

    await page.locator('._aano').scroll({scrollTop: scrollHeight,});

    await new Promise(r => setTimeout(r, DELAY));

    finished = await page.evaluate(() => {

      const el = document.querySelector('._aano');
      console.log(el.scrollHeight - el.scrollTop - el.clientHeight < 1);
      return (el.scrollHeight - el.scrollTop - el.clientHeight < 1);

    });
  
  }

  return; 

}

async function getUsersNames(page){

  return await page.evaluate(() => {

    const el = document.querySelector('._aano');
    const userElements = Array.from(el.childNodes[0].childNodes[0].querySelectorAll('.x1dm5mii.x16mil14.xiojian.x1yutycm.x1lliihq.x193iq5w.xh8yej3'));

    return userElements.map(data => data.querySelector('.xt0psk2').innerText);

  });

}

function getNotFollowingBack(followers, following){

  return following.filter(data => !followers.includes(data));

}

function printUserNotFollowingBack(notFollowingBack){

  notFollowingBack.forEach((name)=> { console.log(name); });

}