const puppeteer = require('puppeteer');

const DELAY = 1500;
const USERNAME = 'wilsondef_jr';
const PASSWORD = '$noopDogg69!';
const TESTING = false;

(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();

  await login(page);  

  // const followers = await getFollowers(page);
  const followers = await getUsers(page, 'followers');
  console.log('FINISHED FOLLOWERS');

  // const following = await getFollowing(page);
  const following = await getUsers(page, 'following');
  console.log('FINISHED FOLLOWING');
  
  const notFollowingBack = getNotFollowingBack(followers, following);

  console.log(`You have ${followers.length} followers`)
  console.log(followers);
  console.log('--------------------------')
  console.log(`You have ${following.length} following`)
  console.log(following);
  console.log('--------------------------')
  console.log(`You have ${notFollowingBack.length} suckers not following you back`)
  console.log(notFollowingBack);

  // await browser.close();
})();

async function login(page){

  await page.goto('https://www.instagram.com/');

  await page.waitForSelector('form'); //login form
  
  await page.type('form input[name=username]', USERNAME);
  await page.type('form input[name=password]', PASSWORD);
  await page.click('form button[type=submit]');

  await page.waitForSelector('._aa56'); //pop up in

  return;

}

async function getUsers(page, type){

  await page.goto(`https://www.instagram.com/${USERNAME}/${type}/?next=%2F`);
  
  await page.waitForSelector('._aano'); //pop up

  await scrollTillEnd(page);

  return await getUsersNames(page);

}

async function scrollTillEnd(page){

  const scrollHeight = await page.evaluate(() => document.querySelector('._aano').scrollHeight);

  await page.locator('._aano').scroll({scrollTop: scrollHeight,});

  await new Promise(r => setTimeout(r, DELAY));

  const finished = await page.evaluate(() => {

    const el = document.querySelector('._aano');
    console.log(el.scrollHeight - el.scrollTop - el.clientHeight < 1);
    return (el.scrollHeight - el.scrollTop - el.clientHeight < 1);

  });

  return new Promise(resolve => (finished || TESTING) ? resolve() : scrollTillEnd(page));

}

async function getUsersNames(page){

  console.log('execute getUsersNames')

  return await page.evaluate(() => {

    const el = document.querySelector('._aano');
    const userElements = Array.from(el.childNodes[0].childNodes[0].querySelectorAll('.x1dm5mii.x16mil14.xiojian.x1yutycm.x1lliihq.x193iq5w.xh8yej3'));

    return userElements.map(data => data.querySelector('.xt0psk2').innerText);

  });

}

function getNotFollowingBack(followers, following){

  return followers.filter(data => !following.includes(data));

}