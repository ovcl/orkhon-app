const CLOUDINARY_CLOUD_NAME = "dsyqxmmxi";
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto`;

const getCloudinaryUrl = (path) => {
    const isRemote = path.startsWith('http');
    const optimization = 'f_auto,q_auto';
    if (isRemote) {
        return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/fetch/${optimization}/${path}`;
    }
    // For local assets that are uploaded to Cloudinary
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${optimization}/${path}`;
};

export const sitesData = [
    {
        "id": 1,
        "name": "Мойлтын амны хуучин чулуун зэвсгийн дурсгалт газар",
        "protectionStatus": "Улсын хамгаалалтад",
        "location": {
            "lat": 47.203667,
            "lng": 102.797083
        },
        "altitude": "1477 м",
        "nameEn": "Moiltyn Am Paleolithic Settlement",
        "category": "Чулуун зэвсэг",
        "description": "Дурсгалт газар нь Өвөрхангай аймгийн Хархорин сумын нутаг Хангай хайрхан уулын өвөр Мойлтын амны рашааны зүүн дэнжид оршдог. Дурсгал нь палеолитын дээд үеэс мезолит, неолитын эхэн үед хамаардаг. Дурсгалт газрыг анх 1949 онд археологич А.П Окладинковын удирдсан Монгол–Зөвлөлтийн чулуун зэвсгийн дурсгал судлах анги илрүүлэн судалгааны эргэлтэнд оруулжээ. А.П.Окладников, Д. Дорж нарын удирдсан “Монголын чулуун зэвсгийн дурсгал судлах анги” 1960, 1961, 1963-1964 онд дурсгалт газарт малтлага судалгаа хийж суурингын соёлт давхрагын зузаан нь 1,5-2 метр бөгөөд малтлагын явцад дээд палеолитын түрүү үеэс мезолит, неолитын эхэн үехийг хамарсан дөрвөн соёлт давхрага байгааг тогтоосон нь Төв, Умард, Дорнод Азийн хэмжээнд нэн ховор дурсгал болохыг тодорхойлсон байна.\n\nМөн 1996-1997 онд Монгол-Францын хамтарсан судалгааны анги дурсгалт газарт ажиллаж хөрсний давхаргыг судлан гурван хурдсаас бүрэлдэх 5 давхарга байгааг тодорхойлон археологийн олдвор хадгалсан 4 давхаргад хийсэн он цаг тогтоох шинжилгээгээр 240+-300 жилиийн өмнө болохыг тогтоожээ. 2018, 2019 онд Монгол-Орос-Америкийн хамтарсан \"Умард монголын чулуун зэвсгийн үе\" төслийн хүрээнд дурсгалын он цаг тогтоох, хөрсний дээж авах судалгааг хийсэн.",
        "descriptionEn": "Located on the eastern terrace of Moiltyn Am valley at the southern foot of Khangai Khairkhan mountain. This site contains 4 cultural layers ranging from the Upper Paleolithic to the Early Neolithic. First discovered in 1949 by the Mongol-Soviet archaeological expedition led by A.P. Okladnikov, subsequent research has shown the cultural layers reach a thickness of 1.5-2 meters. It is considered one of the rarest Paleolithic sites in Central, North, and East Asia, with carbon dating from joint Mongol-French expeditions placing the findings around 24,000 years ago.",
        "panoramaUrl": "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1781246900/panoramas/pano-1.jpg",
        "images": [
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462133/images/1.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462138/images/1-1.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462141/images/1-2.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462149/images/1-3.jpg"
        ]
    },
    {
        "id": 2,
        "name": "Орхон-7 хуучин чулуун зэвсгийн дурсгалт газар",
        "protectionStatus": "Сум, дүүргийн хамгаалалтад",
        "location": {
            "lat": 47.146833,
            "lng": 102.782139
        },
        "altitude": "1478 м",
        "nameEn": "Orkhon-VII Paleolithic Settlement",
        "category": "Чулуун зэвсэг",
        "description": "Чулуун зэвсгийн дунд үед холбогдох томоохон дурсгалын нэг юм. Дурсгал нь Өвөрхангай аймгийн Хархорин сумын төвөөс баруун зүгт 10 орчим км зайд Уханы гацаа хэмээх уулын баруун талын дэнжид оршдог.\n\nДурсгалт газарт анх 1986-1989 онд Монгол-Зөвлөлтийн хамтарсан хуучин чулуун зэвсгийн дурсгал судлах ангийнхан археологийн малтлага судалгаа хижээ. Нийт 3 хэсэг газарт 150 метр квадрат талбайд малтлага хийгдсэн ба хөрсний 11 давхарга илрүүлэн тодорхойлсноос нэгээс бусад нь соёлт давхарга юм. 10-р давхаргаас чулуун зэвсгийн дунд үед холбогдох чулуун зэвсгүүд олдсон байна.",
        "descriptionEn": "A major archaeological site relating to the Middle Paleolithic era. Located 10km west of Kharkhorin on the western terrace of 'Ukhan' mountain. Excavations conducted between 1986-1989 by the Mongol-Soviet joint expedition investigated an area of 150 square meters, revealing 11 distinct soil layers. Of these, 10 are cultural layers containing stone tools and artifacts from the Middle Paleolithic period.",
        "images": [
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462155/images/2.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462164/images/2-1.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462174/images/2-2.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462178/images/2-3.jpg"
        ]
    },
    {
        "id": 3,
        "name": "Гүмбийн дэнжийн буган чулуун хөшөө, булш хиргисүүрийн цогцолбор дурсгал",
        "model3d": "/models/gumbiin_denj_bugan_chuluun_hushuu_1.glb",
        "protectionStatus": "Улсын хамгаалалтад",
        "location": {
            "lat": 47.140556,
            "lng": 102.773806
        },
        "altitude": "1487м",
        "nameEn": "Gumbiin Denj Deer Stone and Burials",
        "category": "Хөшөө дурсгал",
        "description": "Дурсгалт газар нь Өвөрхангай аймгийн Хархорин сумын Барчин уулын өвөр Гүмбийн дэнж хэмээх газарт оршгдог. Энэхүү газарт 1 буган чулуун хөшөө, 30 гаруй булш, хиргисүүрүүд байдаг.\n\nБуган чулуун хөшөө нь 2.4 метр өндөр 0.55 метр өргөн, 0.35 метр зузаантай, дугуй чулуун далантай булшны голд байдаг. Буган чулуун хөшөөний нүүрэн талд нар, сар, ар талд нар болон хэд хэдэн бугыг загварчлан дүрсэлснээс гадна хөшөөний доод хэсгийг ороолгон өргөн бүс гаргаж, түүнээс байлдааны зээтүү, хуйтай хутга зүүсэн байдалтай дүрсэлжээ.",
        "descriptionEn": "Located on the Gumbiin Denj terrace at the foot of Barchin Mountain. This site features a significant deer stone, 2.4m tall, situated in the center of a circular burial mound. The deer stone depicts the sun and moon on its front face and stylized deer on the back. It also features a wide belt carving from which a battle axe and a sheathed knife are suspended, characteristic of Bronze Age warrior monuments.",
        "images": [
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462185/images/3.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462190/images/3-1.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462195/images/3-2.jpg"
        ]
    },
    {
        "id": 4,
        "name": "Нарийны амы булш, хиргисүүрүүд",
        "protectionStatus": "Сум, дүүргийн хамгаалалтад",
        "location": {
            "lat": 47.133233,
            "lng": 102.740942
        },
        "altitude": "1469м",
        "nameEn": "Nariin Am Burials and Khirigsuurs",
        "category": "Булш хиргисүүр",
        "description": "Өвөрхангай аймгийн Хархорин сумын төвөөс баруун зүгт 10 гаруй км зайд Нарийны ам хэмээх газарт оршдог. Энэхүү газарт нийт 26 булш хиргисүүр байх бөгөөд хүрэл зэвсгийн үед холбогдоно.",
        "descriptionEn": "Located about 10km west of the center of Kharkhorin soum, Uvurkhangai province, in a place called Nariin Am. There are a total of 26 burials and khirigsuurs in this area, dating back to the Bronze Age.",
        "images": [
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462201/images/4.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462205/images/4-1.jpg"
        ]
    },
    {
        "id": 5,
        "name": "Тэмээн чулууны амны буган чулуун хөшөө, дөрвөлжин булш",
        "model3d": "/models/temeen_chuluunii_bugan_chuluun_hushuu_3.glb",
        "protectionStatus": "Аймаг, нийслэлийн хамгаалалтад",
        "location": {
            "lat": 46.880389,
            "lng": 102.345333
        },
        "altitude": "1651м",
        "nameEn": "Temeen Chuluu Quadrate Burials and Deer Stones",
        "category": "Хөшөө дурсгал",
        "description": "Өвөрхангай аймгийн Бат-Өлзий сумын нутаг Тэмээн чулууны ам хэмээх газарт хойноос урагш цуварсан байдалтай эртний хэсэг дөрвөлжин булш бий. Эдгээр дөрвөлжин булш нь нийт 42 ширхэг байх бөгөөд тэдгээрийн хашлага чулууг Тэмээн чулууны амны ойролцоох уулнаас авсан саарал өнгийн боржин чулуун хавтангуудаар хийжээ. Хашлага чулууны дундаж өндөр нь 80х100 метр орчим хэмжээтэй байна.\n\nДурсгалт газрын нэг булшинд 5 буган чулуун хөшөөг хашлага чулуу байдлаар ашигласан байна. Мөн өөр нэгэн дөрвөлжин булшны баруун талын хашлага чулуун дээр улаан зосоор хөтлөлцөн зогсож буй 13 хүнийг дүрсэлсэн байдаг. Монгол, ЗХУ-ын эрдэмтэн В.В.Волков, Д.Цэвээндорж нар 1971 онд хэд хэдэн дөрвөлжин булшинд археологийн малтлага, судалгаа хийсэн байна.",
        "descriptionEn": "A cemetery consisting of 42 square burial mounds arranged in a north-south line. The enclosures are constructed from grey granite slabs sourced from nearby mountains, with an average height of 80-100cm. Notably, five deer stones were reused as enclosure slabs for one of the burials. Another burial slab features a unique red ochre rock painting of 13 figures holding hands. Excavated in 1971 by V.V. Volkov and D. Tseveendorj, this site is a prime example of Bronze Age burial practices.",
        "images": [
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462212/images/5.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462222/images/5-1.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462234/images/5-2.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462240/images/5-3.jpg"
        ]
    },
    {
        "id": 6,
        "name": "Ширээт уулын буган чулуун хөшөө, булш хиргисүүрийн цогцолбор дурсгал",
        "model3d": "/models/shireet_uuliin_bugan_chuluun_hushuu_2.glb",
        "protectionStatus": "Аймаг, нийслэлийн хамгаалалтад",
        "location": {
            "lat": 46.970019,
            "lng": 102.223064
        },
        "altitude": "1803м",
        "nameEn": "Shireet Mountain Deer Stones and Burials",
        "category": "Хөшөө дурсгал",
        "description": "Өвөрхангай аймгийн Бат–Өлзий сум, Төвхөн хийдийн ар талд Ширээт уулын энгэрт оршдог. Дурсгалт газарт хүрэл ба төмөр зэвсгийн түрүү үед холбогдох булш, хиргисүүр, буган чулуун хөшөө нэг дор зэрэгцэн байрлана. Буган чулуун хөшөөг дөрвөлжин булшны хашлага болгон ашигласан байдаг. Дурсгалт газарт нийт 4 буган чулуун хөшөө бий.",
        "descriptionEn": "Located on the slopes of Shireet Mountain, directly behind Tuvkhun Monastery. This site includes Bronze Age and early Iron Age burial mounds, khirigsuurs, and deer stones situated in close proximity. Remarkably, several deer stones were repurposed as slabs for the square burial enclosures. There are a total of four deer stones at this specific location.",
        "images": [
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462247/images/6.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462256/images/6-1.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462269/images/6-2.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462275/images/6-3.jpg"
        ]
    },
    {
        "id": 7,
        "name": "Орхоны хөндийн xиpгисүүрүүд",
        "protectionStatus": "Сум, дүүргийн хамгаалалтад",
        "location": {
            "lat": 46.910861,
            "lng": 102.409944
        },
        "altitude": "1596м",
        "nameEn": "Orkhon Valley Khirigsuurs",
        "category": "Булш хиргисүүр",
        "description": "Өвөрхангай аймгийн Хужирт сумын нутаг Сайхан булагийн дэнж, Орхон голын эрэг дагуу Хүрэл зэвсгийн үед холбогдох олон тооны том чулуун хүрээ байгууламж бүхий хиргисүүрүүд оршдог",
        "descriptionEn": "A series of large Bronze Age khirigsuurs (circular or square stone-covered burial mounds with surrounding paths and enclosures) situated on the Saikhan Bulag terrace along the banks of the Orkhon River.",
        "images": [
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462286/images/7.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462295/images/7-1.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462302/images/7-2.jpg"
        ]
    },
    {
        "id": 8,
        "name": "Ар бөөргийн эртний булш",
        "protectionStatus": "Сум, дүүргийн хамгаалалтад",
        "location": {
            "lat": 46.944,
            "lng": 102.56875
        },
        "altitude": "1574м",
        "nameEn": "Ar Boorog Ancient Burials",
        "category": "Булш хиргисүүр",
        "description": "Өвөрхангай аймгийн Хужирт сумын нутаг Ар бөөрөгийн зүүн хөндий Таван булгийн дэнжид өвөрмөц хэлбэрийн дагуул байгууламж бүхий 1 том хиргисүүр, зүүн урд хөндийд Түрэгийн үеийн тахилын онгон, хүн чулуун хөшөө, буган чулуун хөшөө зэрэг дурсгалууд оршдог.\n\nХүн чулуун хөшөө\nДурсгалыг шаравтар өнгийн боржингоор толгой, цээжин биеийн тойм гарган дүрсэлж, нүүр ам огт хийгээгүй, мөлгөр гадаргуутай. Түүний өндөр газрын хөрснөөс дээш 0.60 орчим метр, мөрний өргөн 0.29 метр, зузаан нь 0.20–0.22 метр бөгөөд жижиг дөрвөлжин хашлага хавтанг налуулсан байдалтай байна.",
        "descriptionEn": "Situated in the Ar Boorog valley. The site features a large khirigsuur with unique satellite structures. Additionally, the southeastern valley houses Turkic-era sacrificial sites, balbals (anthropomorphic stone statues), and deer stones. One notable 0.6m granite balbal exhibits a smoothed surface with a stylized head and torso but without facial features, placed against a small square slab enclosure.",
        "images": [
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462318/images/8.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462324/images/8-1.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462330/images/8-2.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462337/images/8-3.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462342/images/8-4.jpg"
        ]
    },
    {
        "id": 9,
        "name": "Бэрхийн булангийн булш хиргисүүрийн цогцолбор дурсгал",
        "protectionStatus": "Сум, дүүргийн хамгаалалтад",
        "location": {
            "lat": 46.986694,
            "lng": 102.605611
        },
        "altitude": "1550м",
        "nameEn": "Berkhiin Bulan Burial and Khirigsuur Complex",
        "category": "Булш хиргисүүр",
        "description": "Өвөрхангай аймгийн Хужирт сумаас зүүн хойш 20 гаруй км зайд Орхон гол руу түрж орсон хадтай уулыг “Бэрхийн булан” гэж нэрлэдэг. Энэ газарт хүрэл зэвсгийн үед холбогдох 10 орчим дурсгал нь баруун хойноос зүүн урд зүгт цуварсан байдалтай байна.",
        "descriptionEn": "Located approximately 20km northeast of Khujirt on a rocky outcrop where the Orkhon river curves sharply. This site, known as 'Berkhiin Bulan', contains about 10 archaeological features from the Bronze Age arranged in a sequence from northwest to southeast.",
        "images": [
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462351/images/9.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462359/images/9-1.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462364/images/9-2.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462371/images/9-3.jpg"
        ]
    },
    {
        "id": 10,
        "name": "Шунхлай уулын булш хиргисүүрийн цогцолбор дурсгал",
        "protectionStatus": "Аймаг, нийслэлийн хамгаалалтад",
        "location": {
            "lat": 46.911056,
            "lng": 102.76825
        },
        "altitude": "1639м",
        "nameEn": "Shunkhlai Mountain Burial and Khirigsuur Complex",
        "category": "Булш хиргисүүр",
        "description": "Өвөрхангай аймгийн Хужирт сумын төвөөс зүүн хойд талд 1 км орчим зайд орших хадтай уулыг “Шунхлай” гэдэг. Энэ уулын баруун доод хормойгоор Хүрэл, төмөр зэвсгийн үед холбогдох 150 гаруй дөрвөлжин булш, хиргисүүрүүд байдаг.\n\nОросын шинжлэх ухааны академи, Монголын шинжлэх ухааны хүрээлэнгээс зохион байгуулсан С.В.Киселев, Х.Пэрлээ нарын удирдсан “Монголын түүх, угсаатны зүй”-н шинжилгээний анги 1949 онд цөөн хэдэн дөрвөлжин булшийг малтаж сумны ясан зэв, шавар ваар, хүрэл чимэглэлийн зүйлс зэргийг илрүүлэн олж Хүрэл зэвсгийн үед холбогдуулан тогтоожээ.",
        "descriptionEn": "Shunkhlai Mountain is located 1km northeast of Khujirt. Along its western base lies a vast complex of over 150 square burials and khirigsuurs dating to the Bronze and Iron Ages. Excavations in 1949 by S.V. Kiselev and Kh. Perlee unearthed bone arrowheads, ceramic vessels, and bronze ornaments, confirming the site's importance as a significant cemetery from the Bronze Age.",
        "images": [
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462379/images/10.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462387/images/10-1.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462397/images/10-2.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462404/images/10-3.jpg"
        ]
    },
    {
        "id": 11,
        "name": "Майхан толгойн булш хиргисүүрийн цогцолбор дурсгал",
        "protectionStatus": "Аймаг, нийслэлийн хамгаалалтад",
        "location": {
            "lat": 46.993889,
            "lng": 102.596778
        },
        "altitude": "1560м",
        "nameEn": "Maikhan Tolgoi Burial and Khirigsuur Complex",
        "category": "Булш хиргисүүр",
        "description": "Өвөрхангай аймгийн Хужирт сумын төвөөс баруун хойд зүгт 30 орчим км зайд Орхон голын хойд эрэг Майхан толгойн бэлээр хүрэл зэвсгийн үед холбогдох булш, хиргисүүр, дөрвөлжин булш байдаг. Дурсгалт газрыг анх 1984 онд археологич Д.Наваан илрүүлж 1987 онд тус газарт 2 удаа археологийн малтлага хижээ.\n\nТүүх, Археологийн хүрээлэн эрдэм шинжилгээний ажилтан Ч.Ерөөл-Эрдэнэ, Ж.Гантулга, Боннын их сургууль У.Бросседер нарын удирдсан Монгол-Гeрманы хамтарсан  “Баркор” төслийн хүрээнд 2008-2018 оныг хүртэл хайгуул, малтлага судалгаа хийсэн.",
        "descriptionEn": "Located 30km northwest of Khujirt on the northern bank of the Orkhon River. The complex includes Bronze Age burials, khirigsuurs, and square burial mounds. First excavated in 1987 by D. Navaan, subsequent extensive research was conducted between 2008-2018 under the joint Mongolian-German 'BarCor' project, led by Ch. Yerool-Erdene and U. Brosseder.",
        "images": [
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462412/images/11.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462420/images/11-1.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462432/images/11-2.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462440/images/11-3.jpg"
        ]
    },
    {
        "id": 12,
        "name": "Хутаг уулын эртний булш",
        "protectionStatus": "Сум, дүүргийн хамгаалалтад",
        "location": {
            "lat": 47.606417,
            "lng": 102.784583
        },
        "altitude": "1509м",
        "nameEn": "Khutag Mountain Burials",
        "category": "Булш хиргисүүр",
        "description": "Архангай аймгийн Хашаат сумын нутаг Хөшөө Цайдамын цогцолбор дурсгалаас хойш 7 км зайд Хутаг ууланд хэд хэдэн булш бий.  Энд дөрвөлжин чулуун дараастай дугуй, дугуй хүрээтэй чулуун дараастай, дөрвөлжин хүрээтэй дугуй дараастай зэрэг 3 төрлийн 40 орчим булш нэг дор зэрэгцэн оршино.\n\nСудлаачид дурсгалыг VII-IX зуун буюу Түрэг улсын үед холбогдоно гэж үзэж байсан ч Монгол-Туркын хамтарсан судалгаагаар Хүннүгийн үеийн булшууд болохыг тогтоосон.",
        "descriptionEn": "Located 7km north of the Khushuu Tsaidam complex on Khutag Mountain. The site consists of approximately 40 burials of three distinct types: circular, square stone-covered, and circular stone-covered. Although initially attributed to the Turkic period (7th-9th centuries), joint Mongolian-Turkish research has conclusively identified these as Xiongnu-era burials.",
        "images": [
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462449/images/12.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462456/images/12-1.jpg"
        ]
    },
    {
        "id": 13,
        "name": "Орхон голын хадны зураг",
        "protectionStatus": "Сум, дүүргийн хамгаалалтад",
        "location": {
            "lat": 46.896333,
            "lng": 102.358444
        },
        "altitude": "1624м",
        "nameEn": "Orkhon River Rock Art",
        "category": "Хадны зураг",
        "description": "Дурсгалт газар нь Өвөрхангай аймгийн Бат-Өлзий сумын нутаг Цагаан голын хүрхрээний зүүн талд Орхон голын хойд эрэг дагуух хүрмэн чулуун хаднууд дээр ан амьтдыг олноор дүрсэлжээ. Энэхүү газарт 20 орчим хаданд нийт 60 гаруй дүрслэлтэй. Янгир, чоно, нум сум харваж буй хүн, загварчилсан буга, шувуу зэргээс гадна тамга тэмдэг дүрсэлжээ.\n\nДурсгалыг анх 1971 онд археологич Н.Сэр-Оджав олж судлан эрдэм шинжилгээ, судалгааны эргэлтэд оруулсан бөгөөд хүрэл зэвсгийн үед холбогдох дурсгал гэж үзжээ.",
        "descriptionEn": "Petroglyphs located on the basalt rocks along the northern bank of the Orkhon river, east of the Tsagaan river waterfall. The site consists of over 60 depictions spread across 20 rock surfaces. Motifs include ibex, wolves, archers, stylized deer, and birds, along with various seals and symbols. First discovered in 1971 by archaeologist N. Ser-Odjav, these petroglyphs are dated to the Bronze Age.",
        "images": [
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462467/images/13.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462475/images/13-1.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462489/images/13-2.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462499/images/13-3.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462511/images/13-4.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462520/images/13-5.jpg"
        ]
    },
    {
        "id": 14,
        "name": "Хөшөө Цайдамын цогцолбор дурсгал",
        "protectionStatus": "Улсын хамгаалалтад",
        "location": {
            "lat": 47.560833,
            "lng": 102.84125
        },
        "altitude": "1407м",
        "nameEn": "Khushuu Tsaidam Memorial Complex",
        "category": "Түрэгийн үе",
        "description": "Архангай аймгийн Хашаат сумын нутаг Хөгшин Орхон голын баруун эрэг, Цайдамын хөндийд оршдог. Энэхүү дурсгал нь 552-745 онд оршин тогтнож байсан Түрэг улсын хаан Билгэ болон түүний жанжин Культегин нарт зориулан байгуулсан тахилгын байгууламж юм.\n\n1889 онд Оросын эрдэмтэн Н.М.Ядринцев нээн олж, 1890 онд Г.Гейкел, В.В.Радловын удирдсан шинжилгээний ангиуд судалсан байна. Түүнээс хойш 1902 онд Польшийн судлаач В.Л.Котвич, 1958 онд Л.Ийсл, Н.Сэр–Оджав нарын удирдсан Монгол– Чехословакийн шинжилгээний анги тус тус судалжээ.\n\nМонгол оронд археологийн судалгаа хийсэн анхны газрын нэг болох Орхоны хөндийн Хөшөө Цайдамд буй Дорнод Түрэг улсын хаад язгууртанд зориулан босгосон тахилын байгууламж нь дэлхийн Түрэг судлал, Төв Азийн археологийн судалгаанд онцгой байр суурь эзэлдэг, шинжлэх ухааны асар их үнэ цэнтэй дурсгал юм.",
        "descriptionEn": "Located in the Tsaidam Valley on the western bank of the Khogshin Orkhon river. This site is a ritual memorial complex dedicated to Bilge Khan (683-734) and his brother General Kul-Tegin (684-731) of the Second Turkic Khaganate. Discovered in 1889 by N.M. Yadrintsev, it contains famous steles with inscriptions in both Old Turkic and Chinese scripts. It is a site of immense scientific value for Turkology and Central Asian archaeology, representing the pinnacle of nomadic monumental art from the 8th century.",
        "images": [
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462528/images/14.jpg"
        ]
    },
    {
        "id": 15,
        "name": "Харбалгас хотын туурь",
        "protectionStatus": "Улсын хамгаалалтад",
        "location": {
            "lat": 47.431889,
            "lng": 102.657694
        },
        "altitude": "1404м",
        "nameEn": "Khar Balgas (Ordu-Baliq) City Ruins",
        "category": "Хот суурин",
        "description": "Төв Азийн нүүдэлчин ард түмний дунд VIII–IX зууны үед ээлжит төр, улсаа байгуулан 100 орчим жил оршин тогтнож байсан Уйгарын хаант улсын нийслэл Орду балык гэдэг их хотын туурь Архангай аймгийн Хотонт сумын нутагт байдаг.\n\nЭртний судлалын бичиг судрын мэдээгээр үзвэл, Харбалгас Уйгарын хааны төрийн өргөө, төрийн яам, гар үйлдвэр, худалдааны хороод, шашны сүм, бэхэлсэн цайз хэрмээс бүрдсэн бөгөөд урагшаа 25 км зайд үргэлжилсэн их хот байсан нь мэдэгжээ.",
        "descriptionEn": "The ruins of Ordu-Baliq, the former capital of the Uyghur Khaganate (8th-9th centuries AD). Located in the Khotont district, the city was once a massive urban center stretching over 25 km. According to historical accounts and archaeological evidence, it contained a royal palace, government offices, craft quarters, markets, and various religious temples, all protected by fortified walls.",
        "panoramaUrl": "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775788782/panoramas/pano-15.jpg",
        "images": [
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462535/images/15.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462540/images/15-1.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462547/images/15-2.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462553/images/15-3.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462565/images/15-4.jpg"
        ]
    },
    {
        "id": 16,
        "name": "Хархорум хотын туурь",
        "protectionStatus": "Улсын хамгаалалтад",
        "location": {
            "lat": 47.206817,
            "lng": 102.840864
        },
        "altitude": "1455м",
        "nameEn": "Kharakhorum (Karakorum) City Ruins",
        "category": "Хот суурин",
        "description": "Хархорум хотыг Чингис хаан 1220 онд Монголын эзэнт гүрний нийслэл болгон байгуулах зарлиг буулгаж түүний III хүү Өгөдэй хаан 1235 он гэхэд орд харш, засаг захиргааны байшин барилгууд, олон шашны сүм дугана, эд эрдэнэс, хөрөнгө зоорийн агуулах савтай, гар үйлдвэр, худалдааны талбай, байшин сууц бүхий дөрвөн талдаа асар хаалгатай хэрмээр хүрээлэгдсэн хотыг байгуулжээ.\n\nХархорум нь тухайн үеийн Монгол орны улс төр, эдийн засаг, соёл, засаг захиргаа, олон улсын харилцааны чухал төв болж байсан. Мөнх хааны үе буюу 1251-1259 онд хотын төв хэсэгт Хятад загварын хороолол буюу гар урчуудын дүүрэг, баруун хойно гэр хороолол, зүүн хойно Ислам шашинтны хороолол болон дэлхийн өнцөг булан бүрээс ирсэн улс үндэстний элч төлөөлөгчид, түүний дотор нангиад, түвэд, уйгур, перс, энэтхэгчүүд, франц, герман, мажар, орос зэрэг олон үндэстэн ястны 10 000- 15 000 орчим хүн төвлөрөн сууж байжээ.\n\nЮНЕСКО-гоос 1995–1996 онд зохион байгуулсан Монгол–Японы хамтарсан шинжилгээний анги тус хотын бүрэн хэмжээний топографийн зураг үйлдэж, Монгол Улсын Засгийн Газрын 1997 оны 241 дүгээр тогтоолоор хотын туурийн хамгаалалтын бүсийг тогтоосон. Тус туурийн хойд талд чулуун яст мэлхий байрладаг.",
        "descriptionEn": "The capital of the Mongol Empire, founded in 1220 by Genghis Khan and fully established by Ogedei Khan in 1235. It served as the empire's administrative, political, and cultural hub for decades. The city was remarkably cosmopolitan, featuring craft quarters, markets, and temples representing various major world religions. Archaeological mapping by joint Mongol-Japanese expeditions in the 1990s confirmed the city's complex layout, including distinct residential districts for diverse nationalities ranging from French to Indian and Russian. A significant stone turtle is located to the north of the ruins.",
        "panoramaTour": [
            {
                "name": "Хархорум хотын туурь", "url": "/images/panoramas/pano-16.jpg", "hotspots": [
                    { "yaw": 0, "pitch": -8, "targetIndex": 1, "label": "Цогт гэр эхийн сүм рүү" }
                ],
                "models3d": [
                    { "url": "/models/kharkhorum_hotiin_tuuri_dahi_melhi_Chuluu_1.glb", "label": "Мэлхий чулуу 3D", "triggerYaw": 120, "triggerPitch": -8 }
                ]
            },
            {
                "name": "Цогт гэр эхийн сүм", "url": "/images/panoramas/pano-16-Цогт_гэр_эхийн_сүм.jpg", "hotspots": [
                    { "yaw": 180, "pitch": -8, "targetIndex": 0, "label": "Туурь руу буцах" },
                    { "yaw": 0, "pitch": -8, "targetIndex": 2, "label": "Мэлхий чулуу руу" }
                ]
            },
            {
                "name": "Мэлхий чулуу", "url": "/images/panoramas/pano-16-1_1_.jpg", "hotspots": [
                    { "yaw": 180, "pitch": -8, "targetIndex": 1, "label": "Буцах" }
                ]
            }
        ],
        "images": [
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462573/images/16.jpg"
        ]
    },
    {
        "id": 17,
        "name": "Баянголын амны эртний хотын туурь",
        "protectionStatus": "Аймаг, нийслэлийн хамгаалалтад",
        "location": {
            "lat": 47.273194,
            "lng": 102.700889
        },
        "altitude": "1502 м",
        "nameEn": "Bayangoliin Am Ancient City Ruins",
        "category": "Хот суурин",
        "description": "Өвөрхангай аймгийн Хархорин сумын төвөөс хойд зүгт 13 км зайд Баянголын аманд эртний хотын 2 туурь бий. Урд талын туурь нь 110х80 метр хэмжээтэй, хойд талынх нь 140х125 метр хэмжээтэй. Эдгээр хоёр туурийн дунд хуучин барилга байсан боловуу гэмээр овгор шороон оромтой. Судлаачид Монголын эзэнт гүрний үеийн их хаадын өвлийн ордны үлдэгдэл туурь болов уу хэмээн таамагладаг.",
        "descriptionEn": "Located in the Bayangol valley, 13km north of Kharkhorin. The site consists of two major structural ruins (110x80m and 140x125m) with additional earthen mounds. Archaeological theories suggest these might be the remains of the imperial winter palaces used by the Great Khans of the Mongol Empire during the 13th century.",
        "images": [
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462579/images/17.jpg",
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462584/images/17-1.jpg"
        ]
    },
    {
        "id": 18,
        "name": "Мэлхийт толгойн ордны туурь",
        "protectionStatus": "Улсын хамгаалалтад",
        "location": {
            "lat": 47.181083,
            "lng": 102.852278
        },
        "altitude": "1596м",
        "nameEn": "Melkhiit Tolgoi Palace Ruins",
        "category": "Хот суурин",
        "description": "Өвөрхангай аймгийн Хархорин сумын төвийн урд талын толгойг “Мэлхийт толгой” гэнэ. Энд 106х78 метрийн хэмжээтэй барилгын дөрвөлжин хэрэмний туурь байдаг. Элэгдэж мэдэгдэхээ больсон хэрмийн дотор 2 хэсэг овгор байх бөгөөд зүүн овгорын доторх довцог дээр чулуун яст мэлхий, түүний нуруун дээр гэрэлт хөшөө суулгах дөрвөлжин суурь байгаа нь гэрэлт хөшөө байсныг гэрчилнэ.",
        "descriptionEn": "Located on Melkhiit Tolgoi hill, south of Kharkhorin. The site contains a 106x78m rectangular enclosure. Inside the remains of the eroded walls are two distinct mounds. On the eastern mound, a stone turtle base survives, which originally supported a stele monument, testifying to the presence of an imperial palace complex from the Mongol Empire era.",
        "images": [
            "https://res.cloudinary.com/dsyqxmmxi/image/upload/v1775462590/images/18.jpg"
        ]
    }
];