import pathlib
import unittest


class PrivateContract(unittest.TestCase):
    def test_safe_configuration(self):
        root = pathlib.Path(__file__).resolve().parents[1]
        config = (root / "server.yml").read_text()
        self.assertIn("auth-default-access: deny-all", config)
        self.assertIn("enable-signup: false", config)
        self.assertIn('attachment-cache-dir: ""', config)
        startup = (root / "start.sh").read_text()
        self.assertIn("--role=user", startup)
        self.assertIn('ntfy user change-role "$NTFY_BOOTSTRAP_USER" user', startup)
        self.assertIn("ntfy access --reset everyone", startup)
        self.assertIn('ntfy access --reset "$NTFY_BOOTSTRAP_USER"', startup)


if __name__ == "__main__":
    unittest.main()
