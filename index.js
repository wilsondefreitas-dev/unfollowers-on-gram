const puppeteer = require('puppeteer');
const readlineSync = require('readline-sync');
const ora = require('ora');

/** */

const DELAY = 5000; //make something better than the delay
const TESTING_MODE = false;

/** */

const spinner = ora();

const username = readlineSync.question('Gram username: ') || '';
const password = readlineSync.question('Gram password: ', {hideEchoBack: true}) || '';

(async () => {

  const browser = await puppeteer.launch({headless: 'old'});
  const page = await browser.newPage();

  await login(page).catch(e => {

    spinner.fail(e.message);
    process.exit(1);

  });
  
  const followers = await getUsers(page, 'followers');
  const following = await getUsers(page, 'following');
  
  showUsersNotFollowingBack(followers, following);

  console.log('\nProcess finished.');

  await browser.close();

})();

/** */

async function login(page){

  spinner.start('Loggin in...');

  await page.goto('https://www.instagram.com/');

  await page.waitForSelector('form');
  
  await page.type('form input[name=username]', username);
  await page.type('form input[name=password]', password);
  await page.click('form button[type=submit]');

  return new Promise(async (resolve, reject) => {

    page.waitForSelector('._ab2z')
      .then(async () => reject(
        {message: 'Something went wrong. Check you username and password.'}
      ))
      .catch(e => e);

    await page.waitForSelector('._aa56')
      .catch((e) => { 
        spinner.fail('Something went wrong. Please, try again.');
        process.exit(1);
      });

    spinner.succeed('Loggin success.');
    resolve();

  });

}

async function getUsers(page, type){

  spinner.start(`Getting ${type} list. It can take some minutes...`);

  await page.goto(`https://www.instagram.com/${username}/${type}/?next=%2F`);
  
  await page.waitForSelector('._aano'); //pop up

  await showAllUsersOnPopup(page);

  const users = await getUsersNames(page);

  spinner.succeed(`The ${type} list is completed: ${users.length} users.`);

  return users;

}

async function showAllUsersOnPopup(page){

  let finished = false;

  while(!finished){ 
    
    const scrollHeight = await page.evaluate(() => document.querySelector('._aano').scrollHeight);

    await page.locator('._aano').scroll({scrollTop: scrollHeight,});

    await new Promise(r => setTimeout(r, DELAY));

    finished = TESTING_MODE || await page.evaluate(() => {

      const el = document.querySelector('._aano');
      return (el.scrollHeight - el.scrollTop - el.clientHeight < 1);

    });
  
  }

  return; 

}

async function getUsersNames(page){

  return await page.evaluate(() => {

    const el = document.querySelector('._aano');
    const userElements = Array.from(el.childNodes[0].childNodes[0].querySelectorAll('.x1dm5mii.x16mil14.xiojian.x1yutycm.x1lliihq.x193iq5w.xh8yej3'));
    const usernames = userElements.map(data => data.querySelector('.xt0psk2').innerText);
    
    return usernames;

  });

}

function showUsersNotFollowingBack(followers, following){

  spinner.start('Checking who is not following you back...');

  const notFollowingBack = following.filter(data => !followers.includes(data));

  if(notFollowingBack.length === 0){

    spinner.succeed(`You have no users not following you back.`);

  }else{
    
    spinner.warn(`You have ${notFollowingBack.length} users not following you back. Here is their names:`);
    printUserNotFollowingBack(notFollowingBack);

  }

}

function printUserNotFollowingBack(notFollowingBack){

  notFollowingBack.forEach((name)=> { console.log(name); });

}