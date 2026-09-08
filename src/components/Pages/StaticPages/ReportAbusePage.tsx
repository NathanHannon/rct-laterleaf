import { Link } from 'react-router-dom';
import StaticPage from './StaticPage';

export default function ReportAbusePage() {
    return (
        <StaticPage title="Copyright concerns." eyebrow="DMCA takedown requests" className="report-abuse-page">
            <section className="intro">
                <p>If you believe content available through LaterLeaf infringes your copyright, you can send us a DMCA takedown request.</p>
                <a className="static-page-action" href="mailto:abuse@laterleaf.com?subject=DMCA%20Takedown%20Notice">Email a DMCA notice ↗</a>
                <p>Send notices to <a href="mailto:abuse@laterleaf.com">abuse@laterleaf.com</a>.</p>
            </section>
            <section>
                <h2>What your notice should include</h2>
                <ul>
                    <li>Your physical or electronic signature, or the signature of someone authorized to act for the copyright owner.</li>
                    <li>Identification of the copyrighted work you believe has been infringed.</li>
                    <li>The specific LaterLeaf URL or other location of the allegedly infringing material.</li>
                    <li>Your contact information, including an email address and mailing address.</li>
                    <li>A statement that you have a good faith belief the use is not authorized by the copyright owner, its agent, or the law.</li>
                    <li>A statement, made under penalty of perjury, that the information in your notice is accurate and that you are authorized to act for the copyright owner.</li>
                </ul>
            </section>
            <section>
                <h2>Looking for something else?</h2>
                <p>For account questions, billing, or technical problems, visit <Link to="/contact">our contact page</Link>. For information about how the service handles data, read the <Link to="/privacy">privacy policy</Link>. For other safety concerns, you can still use the same email address and explain the issue.</p>
            </section>
        </StaticPage>
    );
}
