import com.iskcon.hadapsar.santosh.in.TempleUrlPolicy;
public class TempleUrlPolicyTest {
    private static int checks;
    private static void expect(boolean ok,String message) { checks++; if(!ok)throw new AssertionError(message); }
    public static void main(String[] args) {
        for(String s:new String[]{"index.html","schedule.html?day=1#top","https://bjendermisra-ops.github.io/iskcon-mob","https://bjendermisra-ops.github.io/iskcon-mob/","https://bjendermisra-ops.github.io/iskcon-mob/dev.html"})
            expect(TempleUrlPolicy.isInternal(s),"Internal: "+s);
        for(String s:new String[]{"https://youtube.com/watch?v=abc","https://youtu.be/abc","https://instagram.com/a","https://play.google.com/store/apps/details?id=com.iskcon.hadapsar.santosh.in","https://bjendermisra-ops.github.io/other/","https://bjendermisra-ops.github.io/iskcon-mob-evil/","https://bjendermisra-ops.github.io.evil.test/iskcon-mob/","https://bjendermisra-ops.github.io:444/iskcon-mob/","https://bjendermisra-ops.github.io/iskcon-mob/%2e%2e/other/","../other/","//evil.test/iskcon-mob/"})
            expect(!TempleUrlPolicy.isInternal(s),"External: "+s);
        for(String s:new String[]{"javascript:alert(1)","file:///secret","data:text/html,foo","https://user:password@example.com","https://example.com\\@evil.test/","https://example.com/\nfoo"})
            expect(TempleUrlPolicy.resolve(s)==null,"Reject: "+s);
        expect(TempleUrlPolicy.resolve("schedule.html?day=1#top").equals(TempleUrlPolicy.HOME+"schedule.html?day=1#top"),"Preserve query/fragment");
        System.out.println(checks+" Java URL policy assertions passed");
    }
}
