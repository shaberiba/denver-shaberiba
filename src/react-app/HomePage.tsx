import { DiscordFilled, FacebookFilled } from "@ant-design/icons";
import { FacebookEventsCalendar } from "./Calendar"
import { Flex, Layout, Typography } from "antd"

const { Footer, Content } = Layout;

const basicInfo = (
    <Flex vertical gap={8} style={{ padding: '2rem', borderRadius: 30, border: '1px solid #e5e5e5' }}>
        <Typography>
            いらっしゃいませ！
        </Typography>
        <Typography>
            Welcome to Denver Shaberiba!
        </Typography>
        <Typography>
            We are a collection of both native and learning Japanese speakers in the Denver metro region.
        </Typography>
        <Typography>
            We meet every 1st and 3rd Thursday of each month at Kokopelli Beer Company in Westminster.
        </Typography>
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5240.095335863845!2d-105.0652049!3d39.858461199999994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876b89b091d055d9%3A0x83b00ba06cec466d!2sKokopelli%20Beer%20Company!5e1!3m2!1sen!2sus!4v1756104978484!5m2!1sen!2sus" width="600" height="450" style={{ border: 0 }} allowFullScreen={false} loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
    </Flex>
)

export const HomePage = () => {
    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Content style={{ height: '100%', backgroundColor: '#e5e5e5', alignContent: 'center' }} >
                <Flex vertical align='space-between' justify='center'>
                    <Flex justify='center' align="space-between" wrap gap={16}>
                        {basicInfo}
                        <FacebookEventsCalendar />
                    </Flex>
                </Flex>
            </Content>
            <Footer style={{ textAlign: 'center' }}>{LinkList}</Footer>
        </Layout >
    )
}

const LinkList = (
    <>Follow us on:
        <Flex gap={16} justify='center' style={{ width: '100%', fontSize: '3rem' }}>
            <a target="_blank" href='https://www.facebook.com/broomfieldshaberiba'><FacebookFilled /></a>
            <a target="_blank" href="https://discord.gg/NSyUXR586Y"><DiscordFilled /></a>
        </Flex>
    </>

)