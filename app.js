const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { Feed } = require('feed');
const { log } = require('console');
require("dotenv").config();

const URL = "https://admin.pay.naver.com/notice";
const DATA_DIR = path.join(process.env.GIT_PATH || __dirname, "feeds");
const JSON_FILE = path.join(DATA_DIR, process.env.JSON_FILE || "naverpay_notices.json");
const ATOM_FILE = path.join(DATA_DIR, process.env.FEED_FILE || "naverpay_notice_feed.xml");

// 공지사항 HTML 파싱 함수
async function parseNotices(html) {
    const $ = cheerio.load(html);
    const notices = [];

    $('#noticeList tbody tr').each((_, element) => {
        const id = $(element).find('td:nth-child(1) .num').text().trim();
        const category = $(element).find('td:nth-child(2)').text().trim();
        const title = $(element).find('td:nth-child(3) a').text().trim();
        const link = `https://admin.pay.naver.com${$(element).find('td:nth-child(3) a').attr('href')}`;
        const date = $(element).find('td:nth-child(4) .num').text().trim();
        const views = $(element).find('td:nth-child(5) .num').text().trim();

        if (id) {
            notices.push({ id, category, title, link, date, views });
        }
    });

    return notices;
}

// ATOM 피드 생성 함수
function generateAtomFeed(notices) {
    const feed = new Feed({
        title: "네이버페이 공지사항",
        id: "https://admin.pay.naver.com/notice",
        link: "https://admin.pay.naver.com/notice",
        updated: new Date(),
        author: { name: "네이버페이", link: "https://admin.pay.naver.com" },
    });

    notices.forEach(notice => {
        feed.addItem({
            title: notice.title,
            id: notice.id,
            link: notice.link,
            description: `${notice.category} - ${notice.date}`,
            date: new Date(notice.date.replace(/\./g, '-')),
        });
    });

    return feed.atom1();
}

// 공지사항 데이터 가져오기
async function fetchNotices() {
    const response = await axios.get(URL);
    return parseNotices(response.data);
}

// 기존 JSON 파일 읽기
async function loadExistingNotices() {
    if (fs.existsSync(JSON_FILE)) {
        const data = fs.readFileSync(JSON_FILE, 'utf-8');
        return JSON.parse(data);
    }
    return [];
}

// JSON 데이터 저장
async function saveNotices(notices) {
    fs.writeFileSync(JSON_FILE, JSON.stringify(notices, null, 2));
}

// ATOM 피드 저장
async function saveAtomFeed(feed) {
    fs.writeFileSync(ATOM_FILE, feed);
}

// 메인 실행 함수
(async () => {
    try {
        const newNotices = await fetchNotices();
        const existingNotices = await loadExistingNotices();

        if (JSON.stringify(newNotices) === JSON.stringify(existingNotices)) {
            console.log("공지사항에 변경이 없습니다.");
            return;
        }

        console.log("변경된 공지사항을 발견했습니다. 데이터를 업데이트합니다.");
        await saveNotices(newNotices);

        const atomFeed = generateAtomFeed(newNotices);
        await saveAtomFeed(atomFeed);

        console.log("JSON과 ATOM 피드가 업데이트되었습니다.");
    } catch (error) {
        console.error("프로그램 실행 중 오류 발생:", error);
    }
})();
